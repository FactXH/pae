import requests
import boto3
import json
from botocore.exceptions import ClientError 
from datetime import datetime, timedelta
import re
import pandas as pd
from io import StringIO
from dateutil.relativedelta import relativedelta
import unicodedata
from dateutil.rrule import rrule, MONTHLY

s3_client = boto3.client('s3')
S3_BUCKET = 'factorial-datalake-raw'  # Reemplaza con el nombre de tu bucket

TODAY = datetime.today()
START_DATE = (TODAY - relativedelta(months=2)).strftime('%Y-%m')
MIDDLE_DATE = (TODAY - relativedelta(months=1)).strftime('%Y-%m')
END_DATE = TODAY.strftime('%Y-%m')

# For pl_category historic run
HISTORIC_START = datetime(2025, 1, 1)
PL_CATEGORY_MONTHS = [dt.strftime('%Y-%m') for dt in rrule(MONTHLY, dtstart=HISTORIC_START, until=TODAY)]

MODELS_ALLOWED = ["headcount", "gtm", "expense_planning", "sales_bottomup", "pl_category"]

# Obtener AWS secrets
def get_token_from_ssm(secret_key, token_name):
    """
    Get token from SSM
    """
    region_name = "eu-central-1"

    # Create a Secrets Manager client
    session = boto3.session.Session()
    client = session.client(
        service_name='secretsmanager',
        region_name=region_name
    )

    try:
        get_secret_value_response = client.get_secret_value(
            SecretId=token_name
        )
    except ClientError as e:
        raise e

    secret = json.loads(get_secret_value_response['SecretString'])[secret_key]

    return secret
# Convertir nomber a snake_case
def to_snake_case(text):
    # Normaliza caracteres unicode (quita acentos)
    text = unicodedata.normalize('NFKD', text).encode('ascii', 'ignore').decode('ascii')

    # Reemplaza espacios por guiones bajos
    text = text.replace(" ", "_")

    # Añade guión bajo entre palabras en camel case
    text = re.sub(r'(?<=[a-z0-9])(?=[A-Z])', '_', text)

    # Reemplaza cualquier carácter que no sea letra, número o guion bajo por nada
    text = re.sub(r'[^a-zA-Z0-9_]', '', text)

    # Convierte todo a minúsculas
    return text.lower()

# Obtener los modelos desde la API de Abacum
def fetch_abacum_data():
    # Obtén el token de acceso (autenticación OAuth)
    auth_url = 'https://api.abacum.io/server-authentication/oauth2/token/'
    payload = {
        # 'client_id': '',
        'client_secret': '',
        'grant_type': 'client_credentials'
    }
    response = requests.post(auth_url, data=payload)
    if response.status_code != 200:
            print(f"Error en autenticación: {response.status_code}, {response.text}")
            return None

    return response.json()['access_token']
     
# Función para obtener los modelos
def fetch_scenarios_data(access_token):
    headers = {'Authorization': f'Bearer {access_token}'}
    
    # Obtener la lista de modelos
    models_url = 'https://api.abacum.io/public-api/models'
    models_response = requests.get(models_url, headers=headers)
    models_list = models_response.json().get('data', [])

    breakpoint()

    scenarios_url = 'https://api.abacum.io/public-api/scenarios'
    sceanrios_response = requests.get(scenarios_url, headers=headers)
    scenarios_list = sceanrios_response.json().get('data', [])

    # Obtener los datos de cada modelo
    for index, model in enumerate(models_list):
        model_id = model["id"]
        model_name= to_snake_case(model["name"])
        if model_name in MODELS_ALLOWED:
            for scenario in scenarios_list:
                headers = {'Authorization': f'Bearer {access_token}'}
                scenario_id = scenario["id"]
                scenario_name = to_snake_case(scenario["scenario_name"])
                version_name = to_snake_case(scenario["version_name"])
                scenario_data_url = f'https://api.abacum.io/public-api/models/{model_id}/scenario_data/{scenario_id}'
                scenario_data_response = requests.get(scenario_data_url, headers=headers)
                if scenario_data_response.status_code == 200:
                    response_json = scenario_data_response.json()
                    s3_url = response_json.get('data')
                    metadata = response_json.get('metadata')
                    if s3_url:  #Solo subir si hay una URL válida
                        lambda_client = boto3.client('lambda')

                        payload = {
                            "s3_url": s3_url,
                            "model_name": model_name,
                            "scenario_name": scenario_name,
                            "version_name": version_name,
                            "metadata": metadata,
                            "type_data": "scenario"
                        }

                        try:
                            lambda_client.invoke(
                                FunctionName='lambda-abacum-executor',
                                InvocationType='Event',
                                Payload=json.dumps(payload)
                            )
                        except Exception as e:
                            print(f"Error al invocar la lambda ejecutora: {e}")
                    else:
                        print(f"No se encontró una URL de S3 para el escenario {scenario_id} del modelo {model_id}")
                else:
                    print(scenario_data_response.status_code)

def fetch_models_data(access_token):
    headers = {'Authorization': f'Bearer {access_token}'}
    
    # Obtener la lista de modelos
    models_url = 'https://api.abacum.io/public-api/models'
    models_response = requests.get(models_url, headers=headers)
    models_list = models_response.json().get('data', [])

    all_models = []

    # Obtener los datos de cada modelo
    for index, model in enumerate(models_list):
        model_id = model["id"]
        model_name= to_snake_case(model["name"])
        print(f"Procesando modelo {index + 1}/{len(models_list)}: {model_name}")
        continue
        headers = {'Authorization': f'Bearer {access_token}'}
        if model_name in MODELS_ALLOWED:           
            for date_value in [START_DATE, MIDDLE_DATE, END_DATE]:
                model_data_url = f'https://api.abacum.io/public-api/models/{model_id}/actuals_data?start_date={date_value}&end_date={date_value}'       
                model_data_response = requests.get(model_data_url, headers=headers)
                if model_data_response.status_code == 200:
                    response_json = model_data_response.json()
                    s3_url = response_json.get('data')
                    metadata = response_json.get('metadata')
                    if s3_url:  #Solo subir si hay una URL válida
                        lambda_client = boto3.client('lambda')

                        payload = {
                            "s3_url": s3_url,
                            "model_name": model_name,
                            "scenario_name": "",
                            "version_name": "",
                            "metadata": metadata,
                            "type_data": "model",
                            "date_used": date_value
                        }

                        try:
                            lambda_client.invoke(
                                FunctionName='lambda-abacum-executor',
                                InvocationType='Event',
                                Payload=json.dumps(payload)
                            )
                        except Exception as e:
                            print(f"Error al invocar la lambda ejecutora: {e}")
                    else:
                        print(f"No se encontró una URL de S3 para el modelo {model_id}")
                else:
                    print(model_data_response.status_code)

def main():
    access_token = fetch_abacum_data()
    if not access_token:
        print("Error: No se pudo obtener el token de autenticación.")
        return
    fetch_models_data(access_token)

if __name__ == "__main__":
    main()
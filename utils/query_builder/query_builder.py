

class QueryBuilder:
    def __init__(self):
        pass

    def build_simple_extraction_query(self, table_name, company_id, dedup = False):
        if dedup == False:
            query = f"""
            SELECT *
            FROM {table_name}
            WHERE company_id = {company_id}
            """
        
        else:
            query = f"""
            WITH source_data AS (
                SELECT *,
                    ROW_NUMBER() OVER (PARTITION BY id ORDER BY _event_ts DESC) AS rn
                FROM {table_name}
                WHERE company_id = {company_id}
            )
            SELECT *
            FROM source_data
            WHERE rn = 1
            """
        return query
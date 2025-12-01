import pandas as pd

def convert_decimal_separator(input_path, output_path=None):
    """
    Reads a CSV file, converts decimal points to commas in numeric columns, and writes to Excel.
    Args:
        input_path (str): Path to the input CSV file.
        output_path (str, optional): Path to the output Excel file. If None, uses input_path with '_decimal_comma.xlsx' suffix.
    """
    df = pd.read_csv(input_path)
    numeric_cols = df.select_dtypes(include=['float', 'int']).columns.tolist()
    for col in numeric_cols:
        df[col] = df[col].apply(lambda x: str(x).replace('.', ',') if pd.notnull(x) else '')
    if output_path is None:
        output_path = input_path.replace('.csv', '_decimal_comma.xlsx')
    df.to_excel(output_path, index=False)
    print(f"Excel file saved with decimal commas at: {output_path}")

# Example usage:
# convert_decimal_separator("/home/xavier/Documents/PAE/Projectes/pae/_aprivate/results.csv")

if __name__ == "__main__":
    import sys        
    convert_decimal_separator("/home/xavier/Documents/pae/_adata/climate/by_manager_quali.csv", "/home/xavier/Documents/pae/_adata/climate/climate_by_manager_2025_quali.xlsx")
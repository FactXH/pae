

class QueryBuilder:
    def __init__(self):
        pass

    def build_simple_extraction_query(self, table_name, company_id):
        query = f"""
        SELECT *
        FROM {table_name}
        WHERE company_id = {company_id}
        """
        return query
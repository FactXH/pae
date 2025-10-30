from django.db import models
from django.utils import timezone


class BaseModel(models.Model):
    """
    A simple base model for the engagement app.
    This serves as a foundation model that other models can reference.
    """
    
    factorial_id = models.CharField(max_length=100, help_text="Factorial ID of the entity", null=True, blank=True, unique=True)
    tair_id = models.CharField(max_length=100, help_text="Tair ID of the entity", null=True, blank=True, unique=True)

    # Basic fields
    name = models.CharField(max_length=100, help_text="Name of the entity")
    description = models.TextField(blank=True, help_text="Description of the entity")
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True, help_text="When the record was created")
    updated_at = models.DateTimeField(auto_now=True, help_text="When the record was last updated")
    
    # Status field
    is_active = models.BooleanField(default=True, help_text="Whether the entity is active")
    
    class Meta:
        abstract = True  # Make this an abstract base class - won't create a database table
        verbose_name = "Base Model"
        verbose_name_plural = "Base Models"
        ordering = ['-created_at']
        
    def __str__(self):
        return self.name
        
    def save(self, *args, **kwargs):
        # Custom save logic can go here
        super().save(*args, **kwargs)
    
    @classmethod
    def load_from_query(cls, query: str, 
                       field_mapping: dict = None,
                       create_if_not_exists: bool = True,
                       update_existing: bool = False,
                       unique_fields: list = None):
        """
        Load multiple instances of this model from a SQL query.
        
        This method uses the PAE QueryRunner to execute queries and create
        model instances from the results.
        
        Args:
            query (str): SQL query to execute
            field_mapping (dict): Mapping of query columns to model fields
            create_if_not_exists (bool): Create new instances if they don't exist
            update_existing (bool): Update existing instances with new data
            unique_fields (list): Fields to use for checking existing instances
            
        Returns:
            dict: Result summary with created/updated/failed counts and instances
            
        Example:
            # Simple query
            Employee.load_from_query("SELECT 'John' as first_name, 'Doe' as last_name")
            
            # With field mapping
            Employee.load_from_query(
                "SELECT name_col as n, email_col as e FROM source_table",
                field_mapping={'n': 'first_name', 'e': 'email'}
            )
        """
        try:
            from .base_model_utils.query_loader import load_instances_from_query
            
            return load_instances_from_query(
                model_class=cls,
                query=query,
                field_mapping=field_mapping,
                create_if_not_exists=create_if_not_exists,
                update_existing=update_existing,
                unique_fields=unique_fields or ['email'] if hasattr(cls, 'email') else ['id']
            )
            
        except ImportError as e:
            return {
                'success': False,
                'error': f'Failed to import query loader utility: {str(e)}',
                'created': 0,
                'updated': 0,
                'failed': 0,
                'instances': []
            }

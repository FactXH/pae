from django.db import models
from .base_model import BaseModel


class RelatedModel(models.Model):
    """
    A model that has a foreign key relationship to BaseModel.
    This demonstrates the surrogate key relationship requested.
    """
    
    # Foreign key to BaseModel (surrogate key relationship)
    base_entity = models.ForeignKey(
        BaseModel, 
        on_delete=models.CASCADE, 
        related_name='related_items',
        help_text="Reference to the base entity"
    )
    
    # Additional fields specific to this model
    title = models.CharField(max_length=200, help_text="Title of the related item")
    content = models.TextField(blank=True, help_text="Content of the related item")
    priority = models.IntegerField(
        default=1, 
        choices=[(1, 'Low'), (2, 'Medium'), (3, 'High')],
        help_text="Priority level"
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Status fields
    is_completed = models.BooleanField(default=False, help_text="Whether the item is completed")
    
    class Meta:
        verbose_name = "Related Model"
        verbose_name_plural = "Related Models"
        ordering = ['-priority', '-created_at']
        
    def __str__(self):
        return f"{self.title} (linked to: {self.base_entity.name})"
        
    @property
    def priority_display(self):
        """Get the display name for priority"""
        priority_map = {1: 'Low', 2: 'Medium', 3: 'High'}
        return priority_map.get(self.priority, 'Unknown')

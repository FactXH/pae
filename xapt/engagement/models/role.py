from django.db import models
from .base_model import BaseModel


class Role(BaseModel):
    """
    Role model that inherits from BaseModel.
    Represents roles/positions within the organization with their levels.
    """
    
    # Role information
    role_level_name = models.CharField(
        max_length=150, 
        help_text="Combined role and level name (e.g., 'Senior Software Engineer')"
    )
    role_name = models.CharField(
        max_length=100, 
        help_text="Name of the role (e.g., 'Software Engineer')"
    )
    level_name = models.CharField(
        max_length=50, 
        help_text="Level of the role (e.g., 'Senior', 'Junior', 'Lead')",
        null=True, 
        blank=True
    )
    
    class Meta:
        verbose_name = "Role"
        verbose_name_plural = "Roles"
        ordering = ['role_name', 'level_name']
        unique_together = ['role_name', 'level_name']
        
    def __str__(self):
        return self.role_level_name
        
    def save(self, *args, **kwargs):
        """
        Override save to auto-generate role_level_name if not provided
        """
        if not self.role_level_name and self.level_name and self.role_name:
            self.role_level_name = f"{self.level_name} {self.role_name}"
        super().save(*args, **kwargs)

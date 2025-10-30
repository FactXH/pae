from django.db import models
from django.core.exceptions import ValidationError
from .base_model import BaseModel
from .employee import Employee


class Manager(BaseModel):
    """
    Manager model that inherits from BaseModel.
    Represents the manager-employee relationship with effective dates.
    """
    
    # Manager relationships
    employee = models.ForeignKey(
        Employee,
        on_delete=models.CASCADE,
        related_name='manager_relationships',
        help_text="Employee in this manager relationship"
    )
    manager = models.ForeignKey(
        Employee,
        on_delete=models.CASCADE,
        related_name='managed_employees',
        help_text="Manager in this relationship"
    )
    
    # Effective period
    effective_from = models.DateField(
        help_text="Start date of this manager relationship"
    )
    effective_to = models.DateField(
        null=True,
        blank=True,
        help_text="End date of this manager relationship (null for ongoing relationships)"
    )
    
    class Meta:
        verbose_name = "Manager"
        verbose_name_plural = "Managers"
        ordering = ['-effective_from']
        
    def __str__(self):
        return f"{self.employee.full_name} managed by {self.manager.full_name} ({self.effective_from})"
        
    def clean(self):
        """
        Validate the manager relationship:
        - effective_to must be after effective_from
        - employee cannot be their own manager
        """
        super().clean()
        
        if self.effective_to and self.effective_from:
            if self.effective_to < self.effective_from:
                raise ValidationError({
                    'effective_to': 'End date must be after start date.'
                })
        
        if self.employee == self.manager:
            raise ValidationError({
                'manager': 'An employee cannot be their own manager.'
            })
    
    def save(self, *args, **kwargs):
        """
        Override save to call clean before saving
        """
        self.clean()
        super().save(*args, **kwargs)
    
    @property
    def is_active_relationship(self):
        """
        Check if the manager relationship is currently active based on dates
        """
        from django.utils import timezone
        today = timezone.now().date()
        
        if not self.effective_from:
            return False
        
        if self.effective_from > today:
            return False
        
        if self.effective_to and self.effective_to < today:
            return False
            
        return True
    
    @property
    def relationship_duration_days(self):
        """
        Calculate relationship duration in days
        """
        if not self.effective_to:
            return None
        
        return (self.effective_to - self.effective_from).days

from django.db import models
from django.core.exceptions import ValidationError
from .base_model import BaseModel
from .employee import Employee
from .role import Role


class Contract(BaseModel):
    """
    Contract model that inherits from BaseModel.
    Represents employment contracts with salary and period information.
    """
    
    # Contract relationships
    employee = models.ForeignKey(
        Employee,
        on_delete=models.CASCADE,
        related_name='contracts',
        help_text="Employee associated with this contract"
    )
    role = models.ForeignKey(
        Role,
        on_delete=models.PROTECT,
        related_name='contracts',
        help_text="Role for this contract"
    )
    
    job_title = models.CharField(
        max_length=150,
        help_text="Job title for this contract",
        null=True,
        blank=True
    )

    # Contract financial details
    salary_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        help_text="Salary amount for this contract"
    )
    
    # Contract period
    effective_from = models.DateField(
        help_text="Start date of the contract"
    )
    effective_to = models.DateField(
        null=True,
        blank=True,
        help_text="End date of the contract (null for ongoing contracts)"
    )
    
    class Meta:
        verbose_name = "Contract"
        verbose_name_plural = "Contracts"
        ordering = ['-effective_from']
        
    def __str__(self):
        return f"{self.employee.full_name} - {self.role} ({self.effective_from})"
        
    def clean(self):
        """
        Validate that effective_to is after effective_from
        """
        super().clean()
        if self.effective_to and self.effective_from:
            if self.effective_to < self.effective_from:
                raise ValidationError({
                    'effective_to': 'End date must be after start date.'
                })
    
    def save(self, *args, **kwargs):
        """
        Override save to call clean before saving
        """
        self.clean()
        super().save(*args, **kwargs)
    
    @property
    def is_active_contract(self):
        """
        Check if the contract is currently active based on dates
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
    def contract_duration_days(self):
        """
        Calculate contract duration in days
        """
        if not self.effective_to:
            return None
        
        return (self.effective_to - self.effective_from).days

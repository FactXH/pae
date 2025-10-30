from django.db import models
from django.core.exceptions import ValidationError
from .base_model import BaseModel
from .employee import Employee


class Team(BaseModel):
    """
    Team model that inherits from BaseModel.
    Represents teams and markets in the organization with hierarchical structure.
    """
    
    # Team-specific fields (in addition to BaseModel fields)
    team_name = models.CharField(max_length=100, help_text="Name of the team")
    
    # Nature choices
    NATURE_CHOICES = [
        ('team', 'Team'),
        ('market', 'Market'),
        ('office', 'Office'),
    ]
    nature = models.CharField(
        max_length=10,
        choices=NATURE_CHOICES,
        default='team',
        help_text="Whether this is a team or market"
    )
    
    # Organizational level
    level = models.IntegerField(
        help_text="Organizational level (1 = top level, higher numbers = deeper in hierarchy)",
        null=True,
        blank=True,
    )
    
    # Self-referential foreign key for hierarchy
    parent_team = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='child_teams',
        help_text="Parent team in the organizational hierarchy"
    )
    
    class Meta:
        verbose_name = "Team"
        verbose_name_plural = "Teams"
        ordering = ['level', 'team_name']
        unique_together = ['team_name', 'parent_team']  # Unique name within same parent
        
    def __str__(self):
        return f"{self.team_name} (Level {self.level}, {self.get_nature_display()})"
        
    def save(self, *args, **kwargs):
        # Just use whatever level is provided - no auto-calculation
        # Call BaseModel save (which calls super().save())
        super().save(*args, **kwargs)
    
    def clean(self):
        """Validate the team data"""
        super().clean()
        
        # Prevent circular references
        if self.parent_team:
            if self.parent_team == self:
                raise ValidationError("A team cannot be its own parent")
            
            # Check for circular reference in hierarchy
            current_parent = self.parent_team
            while current_parent:
                if current_parent == self:
                    raise ValidationError("Circular reference detected in team hierarchy")
                current_parent = current_parent.parent_team
    
    @property
    def full_hierarchy_name(self):
        """Return full hierarchical name (e.g., 'Engineering > Backend Team')"""
        if self.parent_team:
            return f"{self.parent_team.full_hierarchy_name} > {self.team_name}"
        return self.team_name
    
    @property
    def is_root_team(self):
        """Check if this is a root team (no parent)"""
        return self.parent_team is None
    
    @property
    def is_leaf_team(self):
        """Check if this is a leaf team (no children)"""
        return not self.child_teams.exists()
    
    def get_all_descendants(self):
        """Get all descendant teams recursively"""
        descendants = list(self.child_teams.all())
        for child in self.child_teams.all():
            descendants.extend(child.get_all_descendants())
        return descendants
    
    def get_all_ancestors(self):
        """Get all ancestor teams up to root"""
        ancestors = []
        current_parent = self.parent_team
        while current_parent:
            ancestors.append(current_parent)
            current_parent = current_parent.parent_team
        return ancestors
    
    def get_team_size(self, include_descendants=False):
        """Get number of team members (current active memberships)"""
        from datetime import date
        today = date.today()
        
        if include_descendants:
            # Include all descendant teams
            teams_to_count = [self] + self.get_all_descendants()
            return TeamMembership.objects.filter(
                team__in=teams_to_count,
                effective_from__lte=today,
                effective_to__gte=today
            ).count()
        else:
            # Only this team
            return self.memberships.filter(
                effective_from__lte=today,
                effective_to__gte=today
            ).count()
    
    def get_current_members(self):
        """Get current active team members"""
        from datetime import date
        today = date.today()
        
        return TeamMembership.objects.filter(
            team=self,
            effective_from__lte=today,
            effective_to__gte=today
        ).select_related('employee')
    
    def get_current_leaders(self):
        """Get current team leaders"""
        return self.get_current_members().filter(is_lead=True)


class TeamMembership(models.Model):
    """
    Model representing the relationship between employees and teams.
    Tracks membership periods and leadership roles.
    """
    
    # Relationship fields
    employee = models.ForeignKey(
        Employee,
        on_delete=models.CASCADE,
        related_name='team_memberships',
        help_text="Employee who is a member of the team"
    )
    
    team = models.ForeignKey(
        Team,
        on_delete=models.CASCADE,
        related_name='memberships',
        help_text="Team the employee belongs to"
    )
    
    # Effective period
    effective_from = models.DateField(
        help_text="Date when the membership becomes effective",
        null=True,
        blank=True,
    )
    
    effective_to = models.DateField(
        help_text="Date when the membership ends",
        null=True,
        blank=True,
    )
    
    # Leadership role
    is_lead = models.BooleanField(
        default=False,
        help_text="Whether this member is a team leader"
    )
    
    # Timestamps (not inheriting from BaseModel as this is a relationship model)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Team Membership"
        verbose_name_plural = "Team Memberships"
        ordering = ['-effective_from', 'team__team_name', 'employee__last_name']
        unique_together = ['employee', 'team', 'effective_from']  # No duplicate memberships on same date
        
    def __str__(self):
        lead_indicator = " (Lead)" if self.is_lead else ""
        return f"{self.employee.full_name} → {self.team.team_name}{lead_indicator} ({self.effective_from} to {self.effective_to})"
    
    def clean(self):
        """Validate the membership data"""
        super().clean()
        
        # Validate date range
        if self.effective_from and self.effective_to and self.effective_from > self.effective_to:
            raise ValidationError("Effective start date must be before end date")
        
        # Check for overlapping memberships in the same team
        if self.employee and self.team and self.effective_from and self.effective_to:
            overlapping = TeamMembership.objects.filter(
                employee=self.employee,
                team=self.team,
                effective_from__lt=self.effective_to,
                effective_to__gt=self.effective_from
            ).exclude(pk=self.pk)
            
            if overlapping.exists():
                raise ValidationError(
                    f"Employee {self.employee.full_name} already has an overlapping membership in {self.team.team_name}"
                )
    
    @property
    def is_active(self):
        """Check if membership is currently active"""
        from datetime import date
        today = date.today()
        
        # Handle None values in date comparison
        if not self.effective_from:
            return False
        if not self.effective_to:
            # If no end date, consider it active if start date has passed
            return self.effective_from <= today
        
        return self.effective_from <= today <= self.effective_to
    
    @property
    def duration_days(self):
        """Calculate membership duration in days"""
        if self.effective_from and self.effective_to:
            return (self.effective_to - self.effective_from).days
        return 0
    
    @classmethod
    def get_active_memberships(cls, date_filter=None):
        """Get all active memberships for a given date (default: today)"""
        from datetime import date
        filter_date = date_filter or date.today()
        
        return cls.objects.filter(
            effective_from__lte=filter_date,
            effective_to__gte=filter_date
        )
    
    @classmethod
    def get_employee_current_teams(cls, employee):
        """Get all current teams for an employee"""
        from datetime import date
        today = date.today()
        
        return cls.objects.filter(
            employee=employee,
            effective_from__lte=today,
            effective_to__gte=today
        ).select_related('team')
    
    @classmethod
    def get_team_history(cls, team):
        """Get complete membership history for a team"""
        return cls.objects.filter(team=team).select_related('employee').order_by('-effective_from')

# Models package for engagement app
# This allows importing models from the models package

from .base_model import BaseModel
from .employee import Employee
from .team import Team, TeamMembership
from .role import Role
from .contract import Contract
from .manager import Manager

__all__ = ['BaseModel', 'RelatedModel', 'Employee', 'Team', 'TeamMembership', 'Role', 'Contract', 'Manager']

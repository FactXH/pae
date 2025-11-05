from django.db import models
from django.core.exceptions import ValidationError
from .base_model import BaseModel
from .employee import Employee


class PerformanceReview(BaseModel):
    """
    PerformanceReview model that inherits from BaseModel.
    Represents performance reviews for employees.
    """
    employee = models.ForeignKey(
        Employee,
        on_delete=models.CASCADE,
        related_name='performance_reviews',
        help_text="Employee associated with this performance review"
    )

    manager = models.ForeignKey(
        Employee,
        on_delete=models.SET_NULL,
        related_name='managed_performance_reviews',
        null=True,
        blank=True,
        help_text="Manager who conducted the performance review"
    )

    performance_name = models.CharField(
        max_length=200,
        help_text="Name or title of the performance review"
    )

    performance_date = models.DateField(
        help_text="Date of the performance review"
    )

    self_score = models.PositiveIntegerField(
        help_text="Score given by the employee in self-assessment",
        null=True,
        blank=True
    )

    overall_score = models.PositiveIntegerField(
        help_text="Score given during the performance review",
        null=True,
        blank=True
    )

    manager_questionary = models.TextField(
        help_text="Manager's responses to the performance review questions",
        null=True,
        blank=True
    )

    self_questionary = models.TextField(
        help_text="Employee's responses to the performance review questions",
        null=True,
        blank=True
    )


    class Meta:
        verbose_name = "Performance Review"
        verbose_name_plural = "Performance Reviews"
        ordering = ['-performance_date']

    def __str__(self):
        return f"{self.performance_name} - {self.employee.full_name} ({self.performance_date})"
    

    def post_or_update_to_airtable(self):
        """
        Post or update the performance review to Airtable via TairtableExporter.
        """
        from ..utils.tairtable_exporter import TairtableExporter
        exporter = TairtableExporter()

        if self.tair_id is None:
            return exporter._export_performance_review(self)

        else:
            # Update existing record logic can be implemented here
            return exporter._update_performance_review(self)

    
    
    def return_self_questionarie_markdown(self):
        """Return the self-questionnaire formatted as markdown"""
        return self.return_markdown_questionary(self.self_questionary)

    def return_manager_questionarie_markdown(self):
        """Return the manager questionnaire formatted as markdown"""
        return self.return_markdown_questionary(self.manager_questionary)

    def return_markdown_questionary(self, data):
        """
        Parse questionnaire JSON data and return formatted markdown.
        
        Args:
            data: String containing JSON questionnaire data (can be split with ]/[ separator)
            
        Returns:
            str: Formatted markdown with H3 headings for questions and normal text for answers
        """
        import json
        import re
        
        if not data:
            return "*No questionnaire data available*"
        
        def strip_html(text):
            """Remove HTML tags from text"""
            if not text:
                return text
            # Remove HTML tags
            clean = re.sub(r'<[^>]+>', '', str(text))
            # Decode common HTML entities
            clean = clean.replace('&nbsp;', ' ')
            clean = clean.replace('&lt;', '<')
            clean = clean.replace('&gt;', '>')
            clean = clean.replace('&amp;', '&')
            clean = clean.replace('&quot;', '"')
            clean = clean.replace('&#39;', "'")
            return clean.strip()
        
        def extract_question_text(label_dict):
            """Extract question text from label dict, trying multiple keys"""
            # Try different possible keys: 'manager', 'self', or any other key
            for key in ['manager', 'self']:
                if key in label_dict:
                    return label_dict[key]
            # If neither found, return the first value
            if label_dict:
                return next(iter(label_dict.values()), 'Unknown Question')
            return 'Unknown Question'
        
        def extract_answer_text(answer_obj):
            """Extract and format answer text from answer object"""
            if answer_obj is None:
                return "*No answer provided*"
            
            if isinstance(answer_obj, dict):
                # Could have 'value', 'rating', 'text', 'comment', etc.
                value = answer_obj.get('value')
                rating = answer_obj.get('rating')
                text = answer_obj.get('text')
                comment = answer_obj.get('comment')
                
                answer_parts = []
                
                # Add rating/value if present
                if value is not None:
                    answer_parts.append(f"**Rating**: {value}")
                elif rating is not None:
                    answer_parts.append(f"**Rating**: {rating}")
                
                # Add text if present (strip HTML)
                if text:
                    clean_text = strip_html(text)
                    if clean_text:
                        answer_parts.append(clean_text)
                
                # Add comment if present (strip HTML)
                if comment:
                    clean_comment = strip_html(comment)
                    if clean_comment:
                        answer_parts.append(f"\n*Comment*: {clean_comment}")
                
                return "\n\n".join(answer_parts) if answer_parts else "*No answer provided*"
            
            elif isinstance(answer_obj, str):
                # Direct string answer (strip HTML)
                clean_text = strip_html(answer_obj)
                return clean_text if clean_text else "*No answer provided*"
            
            else:
                return str(answer_obj)
        
        try:
            # Split the string into separate JSON arrays (handles ]/[ separator)
            json_parts = re.split(r'\]/\[', data)
            json_parts = [p.strip('[]') for p in json_parts]  # clean brackets
            
            all_questions = []
            
            for part in json_parts:
                # Re-wrap as a valid JSON array
                try:
                    parsed_data = json.loads(f"[{part}]")
                except json.JSONDecodeError:
                    continue
                
                for item in parsed_data:
                    # Sometimes it's a section with nested questions
                    if item.get('type') == 'section':
                        for q in item.get('questions', []):
                            question_data = q.get('question', {})
                            label = question_data.get('label', {})
                            question_text = extract_question_text(label)
                            answer_obj = q.get('answer')
                            answer_text = extract_answer_text(answer_obj)
                            all_questions.append((question_text, answer_text))
                    
                    # Direct answered_question objects
                    elif item.get('type') == 'answered_question':
                        question_data = item.get('question', {})
                        label = question_data.get('label', {})
                        question_text = extract_question_text(label)
                        answer_obj = item.get('answer')
                        answer_text = extract_answer_text(answer_obj)
                        all_questions.append((question_text, answer_text))
            
            # Build markdown output
            if not all_questions:
                return "*No questions found in questionnaire data*"
            
            md = []
            for idx, (question, answer) in enumerate(all_questions, start=1):
                md.append(f"### {idx}. {question}")
                md.append("")
                md.append(answer)
                md.append("")
            
            return "\n".join(md)
            
        except Exception as e:
            return f"*Error parsing questionnaire data: {str(e)}*"
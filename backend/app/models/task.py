"""Task model for mock interview questions."""
from sqlalchemy import Column, String, Integer, Text
from app.database import Base


class Task(Base):
    """
    Task table for storing mock interview questions.
    Questions are pulled based on user-selected parameters.
    """
    __tablename__ = "tasks"
    
    task_id = Column(Integer, primary_key=True, autoincrement=True)
    task_question = Column(Text, nullable=False)
    task_answer = Column(Text, nullable=True)  # Reference answer for LLM context
    company_tier = Column(String, nullable=False)  # tier1, tier2
    employee_level = Column(String, nullable=False)  # junior, middle, senior
    type = Column(String, nullable=False)  # product_analyst, data_analyst
    subtype = Column(String, nullable=False)  # statistics, ab_testing, probability, python, sql, random
    source = Column(String, nullable=True)  # Original source of the question

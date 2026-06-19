import logging
import asyncio
from datetime import datetime

logger = logging.getLogger(__name__)

async def send_rejection_email_task(email: str, applicant_name: str, reason: str):
    """
    Simulates sending an email by writing a formatted log.
    In a real production environment, this would connect to an SMTP server 
    (e.g., AWS SES, SendGrid) and dispatch the email.
    """
    # Simulate network latency for sending an email
    await asyncio.sleep(1.5)
    
    email_body = f"""
    ============================================================
    [MOCK EMAIL DISPATCH]
    TO: {email}
    SUBJECT: Decision DNA - Credit Application Update
    DATE: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}
    
    Dear {applicant_name},
    
    Thank you for applying. After careful consideration by our automated 
    Decision DNA engine, we are unable to approve your application at this time.
    
    Reason for decision: 
    {reason}
    
    If you believe this decision is in error or you have questions about your
    application, please contact our support team.
    
    Sincerely,
    The Decision DNA Automated Governance Team
    ============================================================
    """
    
    # Log the email explicitly as a high-level info
    logger.info(email_body)
    print(email_body) # Ensure it prints to terminal visibly

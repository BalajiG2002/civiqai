from sqlalchemy import (create_engine, Column, String,
                         Float, Integer, DateTime, Text)
from sqlalchemy.orm import declarative_base, sessionmaker
from datetime import datetime
from typing import Optional
from core.config import settings

engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()

class ComplaintDB(Base):
    __tablename__ = "complaints"
    id              = Column(String,   primary_key=True)
    issue_type      = Column(String,   nullable=False)
    description     = Column(Text,     nullable=True)
    location_text   = Column(String,   nullable=True)
    lat             = Column(Float,    nullable=True)   # ← nullable
    lng             = Column(Float,    nullable=True)   # ← nullable
    ward            = Column(String,   nullable=True)
    zone            = Column(String,   nullable=True)
    severity        = Column(String,   nullable=True)
    status          = Column(String,   default="open")
    priority        = Column(String,   default="P3")
    cluster_id      = Column(String,   nullable=True)
    image_url       = Column(String,   nullable=True)
    streetview_url  = Column(String,   nullable=True)
    citizen_email   = Column(String,   nullable=True)
    department      = Column(String,   nullable=True)
    officer_name    = Column(String,   nullable=True)
    dept_email      = Column(String,   nullable=True)
    work_order_id   = Column(String,   nullable=True)
    prediction      = Column(Text,     nullable=True)
    submitted_at    = Column(DateTime, default=datetime.utcnow)
    resolved_at     = Column(DateTime, nullable=True)

class ClusterDB(Base):
    __tablename__ = "clusters"
    id             = Column(String,   primary_key=True)
    issue_type     = Column(String,   nullable=False)
    center_lat     = Column(Float,    nullable=True)
    center_lng     = Column(Float,    nullable=True)
    radius_m       = Column(Integer,  nullable=True)
    size           = Column(Integer,  default=1)
    score          = Column(Float,    default=0.0)
    priority       = Column(String,   default="pending")
    location_text  = Column(String,   nullable=True)
    created_at     = Column(DateTime, default=datetime.utcnow)
    updated_at     = Column(DateTime, default=datetime.utcnow)

class WorkOrderDB(Base):
    __tablename__ = "work_orders"
    id           = Column(String,   primary_key=True)
    complaint_id = Column(String,   nullable=False)
    cluster_id   = Column(String,   nullable=True)
    department   = Column(String,   nullable=True)
    dept_email   = Column(String,   nullable=True)
    officer_name = Column(String,   nullable=True)
    email_body   = Column(Text,     nullable=True)
    status       = Column(String,   default="sent")
    sent_at      = Column(DateTime, default=datetime.utcnow)
    replied_at   = Column(DateTime, nullable=True)

Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

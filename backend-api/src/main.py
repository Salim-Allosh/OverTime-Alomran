"""
FastAPI implementation for session management.
No seed data; relies entirely on DB state.
"""
from datetime import datetime, date
from calendar import month_name
from decimal import Decimal
from typing import List, Optional

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from passlib.context import CryptContext
from pydantic import BaseModel, condecimal, Field
from sqlalchemy import (
    Column,
    Integer,
    String,
    Date,
    DateTime,
    DECIMAL,
    ForeignKey,
    Boolean,
    Text,
    create_engine,
    func,
    case,
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import Session, relationship, sessionmaker, joinedload
import os
from pathlib import Path
import logging

# Configure logging for debugging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# MySQL Database Configuration
# Use environment variables for database connection (for production flexibility)
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_NAME = os.getenv("DB_NAME", "AlomranReportsDB")
DB_PORT = os.getenv("DB_PORT", "3306")

# Construct MySQL connection URL
# Using pymysql driver (install: pip install pymysql)
# Alternative: mysql+mysqlconnector:// (requires mysql-connector-python)
DATABASE_URL = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}?charset=utf8mb4"

logger.info(f"Database URL: mysql+pymysql://{DB_USER}:***@{DB_HOST}:{DB_PORT}/{DB_NAME}")
logger.info(f"Connecting to MySQL database: {DB_NAME}")

# Create engine with proper connection arguments for MySQL
try:
    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,  # Verify connections before using
        pool_recycle=3600,   # Recycle connections after 1 hour
        echo=False           # Set to True for SQL query logging
    )
    logger.info("Database engine created successfully")
except Exception as e:
    logger.error(f"Failed to create database engine: {e}")
    logger.error("Make sure MySQL is running and the database exists")
    raise
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")
oauth2_scheme_optional = OAuth2PasswordBearer(tokenUrl="auth/login", auto_error=False)


# ---------- DB MODELS ----------
class Branch(Base):
    __tablename__ = "branches"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, unique=True)
    default_hourly_rate = Column(DECIMAL(10, 2), nullable=False, default=0)

    operation_accounts = relationship("OperationAccount", back_populates="branch")
    sales_staff = relationship("SalesStaff", back_populates="branch")


class OperationAccount(Base):
    __tablename__ = "operation_accounts"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    branch_id = Column(Integer, ForeignKey("branches.id"), nullable=False)
    is_super_admin = Column(Boolean, default=False)
    is_sales_manager = Column(Boolean, default=False)  # مدير مبيعات في الفرع
    is_operation_manager = Column(Boolean, default=False)  # مدير أوبريشن للفرع
    is_branch_account = Column(Boolean, default=False)  # حساب الفرع (عرض فقط)
    is_backdoor = Column(Boolean, default=False)  # حساب باكدور (مخفي)
    is_active = Column(Boolean, default=True)  # تفعيل/تعطيل الحساب

    branch = relationship("Branch", back_populates="operation_accounts")


class SessionDraft(Base):
    __tablename__ = "session_drafts"
    id = Column(Integer, primary_key=True, index=True)
    branch_id = Column(Integer, ForeignKey("branches.id"), nullable=False, index=True)
    teacher_name = Column(String(255), nullable=False)
    student_name = Column(String(255), nullable=False)
    session_date = Column(Date, nullable=False)
    start_time = Column(String(10), nullable=True)
    end_time = Column(String(10), nullable=True)
    duration_hours = Column(DECIMAL(5, 2), nullable=False)
    duration_text = Column(String(50), nullable=False)
    status = Column(String(50), nullable=False, default="pending")
    rejection_reason = Column(String(500), nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)


class SessionRecord(Base):
    __tablename__ = "sessions"
    id = Column(Integer, primary_key=True, index=True)
    branch_id = Column(Integer, ForeignKey("branches.id"), nullable=False, index=True)
    teacher_name = Column(String(255), nullable=False)
    student_name = Column(String(255), nullable=False)
    session_date = Column(Date, nullable=False)
    start_time = Column(String(10), nullable=True)
    end_time = Column(String(10), nullable=True)
    duration_hours = Column(DECIMAL(5, 2), nullable=False)
    duration_text = Column(String(50), nullable=False)
    contract_number = Column(String(100), nullable=False)
    hourly_rate = Column(DECIMAL(10, 2), nullable=False)
    calculated_amount = Column(DECIMAL(12, 2), nullable=False)
    location = Column(String(20), nullable=False, default="internal")  # internal or external
    approved_by = Column(Integer, ForeignKey("operation_accounts.id"), nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)


class Expense(Base):
    __tablename__ = "expenses"
    id = Column(Integer, primary_key=True, index=True)
    branch_id = Column(Integer, ForeignKey("branches.id"), nullable=False, index=True)
    teacher_name = Column(String(255), nullable=True)  # Optional teacher name
    title = Column(String(255), nullable=False)
    amount = Column(DECIMAL(12, 2), nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)


class Contract(Base):
    __tablename__ = "contracts"
    id = Column(Integer, primary_key=True, index=True)
    contract_number = Column(String(100), unique=True, nullable=False, index=True)
    student_name = Column(String(255), nullable=False)
    teacher_name = Column(String(255), nullable=False, index=True)
    branch_id = Column(Integer, ForeignKey("branches.id"), nullable=False, index=True)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=True)
    hourly_rate = Column(DECIMAL(10, 2), nullable=False)
    total_hours = Column(DECIMAL(5, 2), default=0)
    status = Column(String(50), nullable=False, default="active", index=True)  # active, completed, cancelled
    notes = Column(String(1000), nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, nullable=True, onupdate=func.now())


class DailyReport(Base):
    __tablename__ = "daily_reports"
    id = Column(Integer, primary_key=True, index=True)
    branch_id = Column(Integer, ForeignKey("branches.id"), nullable=False, index=True)
    report_date = Column(Date, nullable=False, index=True)
    total_sessions = Column(Integer, nullable=False, default=0)
    total_hours = Column(DECIMAL(10, 2), nullable=False, default=0)
    total_amount = Column(DECIMAL(12, 2), nullable=False, default=0)
    internal_sessions = Column(Integer, nullable=False, default=0)
    external_sessions = Column(Integer, nullable=False, default=0)
    internal_amount = Column(DECIMAL(12, 2), nullable=False, default=0)
    external_amount = Column(DECIMAL(12, 2), nullable=False, default=0)
    total_expenses = Column(DECIMAL(12, 2), nullable=False, default=0)
    net_profit = Column(DECIMAL(12, 2), nullable=False, default=0)
    notes = Column(String(1000), nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, nullable=True, onupdate=func.now())


class SalesStaff(Base):
    __tablename__ = "sales_staff"
    id = Column(Integer, primary_key=True, index=True)
    branch_id = Column(Integer, ForeignKey("branches.id"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    phone = Column(String(20), nullable=True)
    email = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    branch = relationship("Branch", back_populates="sales_staff")


class DailySalesReport(Base):
    __tablename__ = "daily_sales_reports"
    id = Column(Integer, primary_key=True, index=True)
    branch_id = Column(Integer, ForeignKey("branches.id"), nullable=False, index=True)
    sales_staff_id = Column(Integer, ForeignKey("sales_staff.id"), nullable=False, index=True)
    report_date = Column(Date, nullable=False, index=True)
    sales_amount = Column(DECIMAL(12, 2), nullable=False)
    number_of_deals = Column(Integer, nullable=False, default=0)
    daily_calls = Column(Integer, nullable=False, default=0)
    hot_calls = Column(Integer, nullable=False, default=0)
    walk_ins = Column(Integer, nullable=False, default=0)
    branch_leads = Column(Integer, nullable=False, default=0)
    online_leads = Column(Integer, nullable=False, default=0)
    extra_leads = Column(Integer, nullable=False, default=0)
    number_of_visits = Column(Integer, nullable=False, default=0)
    notes = Column(String(1000), nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    branch = relationship("Branch")
    sales_staff = relationship("SalesStaff")
    visits = relationship("SalesVisit", back_populates="daily_sales_report", cascade="all, delete-orphan")


class SalesVisit(Base):
    __tablename__ = "sales_visits"
    id = Column(Integer, primary_key=True, index=True)
    daily_sales_report_id = Column(Integer, ForeignKey("daily_sales_reports.id"), nullable=False, index=True)
    branch_id = Column(Integer, ForeignKey("branches.id"), nullable=False, index=True)
    update_details = Column(Text, nullable=True)
    visit_order = Column(Integer, nullable=False, default=1)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    daily_sales_report = relationship("DailySalesReport", back_populates="visits")
    branch = relationship("Branch")


# ---------- SCHEMAS ----------
class BranchIn(BaseModel):
    name: str
    default_hourly_rate: condecimal(max_digits=10, decimal_places=2)


class BranchOut(BranchIn):
    id: int

    class Config:
        from_attributes = True


class OperationAccountIn(BaseModel):
    username: str
    password: Optional[str] = Field(default=None, min_length=6)
    branch_id: int
    is_super_admin: bool = False
    is_sales_manager: bool = False  # مدير مبيعات في الفرع
    is_operation_manager: bool = False  # مدير أوبريشن للفرع
    is_branch_account: bool = False  # حساب الفرع (عرض فقط)
    is_backdoor: bool = False  # حساب باكدور (مخفي)
    is_active: bool = True  # تفعيل/تعطيل الحساب


class OperationAccountOut(BaseModel):
    id: int
    username: str
    branch_id: int
    is_super_admin: bool
    is_sales_manager: bool  # مدير مبيعات في الفرع
    is_operation_manager: bool  # مدير أوبريشن للفرع
    is_branch_account: bool  # حساب الفرع (عرض فقط)
    is_backdoor: bool  # حساب باكدور (مخفي)
    is_active: bool  # تفعيل/تعطيل الحساب

    class Config:
        from_attributes = True


class DraftCreate(BaseModel):
    teacher_name: str
    student_name: str
    session_date: date
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    duration_hours: condecimal(max_digits=5, decimal_places=2)
    duration_text: str
    branch_id: int


class DraftOut(BaseModel):
    id: int
    branch_id: int
    teacher_name: str
    student_name: str
    session_date: date
    start_time: Optional[str]
    end_time: Optional[str]
    duration_hours: Decimal
    duration_text: str
    status: str
    rejection_reason: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class DraftApprove(BaseModel):
    contract_number: str
    hourly_rate: condecimal(max_digits=10, decimal_places=2)
    location: str = "internal"  # internal or external


class DraftReject(BaseModel):
    rejection_reason: str


class DraftUpdate(BaseModel):
    teacher_name: Optional[str] = None
    student_name: Optional[str] = None
    session_date: Optional[date] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    duration_hours: Optional[condecimal(max_digits=5, decimal_places=2)] = None
    duration_text: Optional[str] = None


class SessionOut(BaseModel):
    id: int
    branch_id: int
    teacher_name: str
    student_name: str
    session_date: date
    start_time: Optional[str]
    end_time: Optional[str]
    duration_hours: Decimal
    duration_text: str
    contract_number: str
    hourly_rate: Decimal
    calculated_amount: Decimal
    location: str
    approved_by: int
    created_at: datetime

    class Config:
        from_attributes = True


class ExpenseIn(BaseModel):
    title: str
    amount: condecimal(max_digits=12, decimal_places=2)
    branch_id: int
    teacher_name: Optional[str] = None
    month: Optional[int] = None  # Month (1-12) for monthly expenses
    year: Optional[int] = None  # Year for monthly expenses


class ExpenseOut(ExpenseIn):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class SummaryOut(BaseModel):
    teacher_name: str
    total_hours: Decimal
    total_amount: Decimal


class TeacherSummary(BaseModel):
    teacher_name: str
    total_hours: Decimal
    total_amount: Decimal
    session_count: int


# ---------- UTILITIES ----------
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_db():
    Base.metadata.create_all(bind=engine)


def verify_password(plain: str, hashed: str) -> bool:
    """التحقق من كلمة المرور باستخدام bcrypt مباشرة"""
    try:
        import bcrypt
        return bcrypt.checkpw(plain.encode('utf-8'), hashed.encode('utf-8'))
    except Exception:
        # Fallback to passlib if bcrypt fails
        try:
            return pwd_context.verify(plain, hashed)
        except Exception:
            return False


def hash_password(password: str) -> str:
    """تشفير كلمة المرور باستخدام bcrypt مباشرة"""
    try:
        import bcrypt
        salt = bcrypt.gensalt()
        return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')
    except Exception:
        # Fallback to passlib if bcrypt fails
        return pwd_context.hash(password)


def authenticate_user(db: Session, username: str, password: str) -> OperationAccount:
    user = db.query(OperationAccount).filter(OperationAccount.username == username).first()
    if not user or not verify_password(password, user.password_hash):
        return None
    return user


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> OperationAccount:
    user = db.query(OperationAccount).filter(OperationAccount.username == token).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is disabled")
    return user


def get_optional_user(token: str = Depends(oauth2_scheme_optional), db: Session = Depends(get_db)) -> Optional[OperationAccount]:
    if not token:
        return None
    return db.query(OperationAccount).filter(OperationAccount.username == token).first()


def assert_branch_access(user: OperationAccount, branch_id: int):
    """التحقق من صلاحية الوصول للفرع"""
    # Backdoor account يمكنه الوصول لكل شيء
    if user.is_backdoor:
        return
    
    # Super Admin يمكنه الوصول لكل شيء
    if user.is_super_admin:
        return
    
    # باقي الحسابات يمكنها الوصول لفرعها فقط
    if user.branch_id != branch_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Branch access denied")


def require_super_admin(user: OperationAccount):
    """يتطلب صلاحيات Super Admin أو Backdoor"""
    if not user.is_super_admin and not user.is_backdoor:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Super admin access required")


def require_operation_manager(user: OperationAccount):
    """يتطلب صلاحيات Operation Manager أو أعلى"""
    if not (user.is_super_admin or user.is_operation_manager or user.is_backdoor):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Operation manager access required")


def require_sales_manager(user: OperationAccount):
    """يتطلب صلاحيات Sales Manager أو أعلى"""
    if not (user.is_super_admin or user.is_sales_manager or user.is_operation_manager or user.is_backdoor):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Sales manager access required")


def can_edit(user: OperationAccount):
    """التحقق من إمكانية التعديل (ليس Branch Account فقط)"""
    if user.is_branch_account and not (user.is_super_admin or user.is_backdoor):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Read-only access")


def get_user_role(user: OperationAccount) -> str:
    """الحصول على نوع الحساب"""
    if user.is_backdoor:
        return "backdoor"
    if user.is_super_admin:
        return "super_admin"
    if user.is_operation_manager:
        return "operation_manager"
    if user.is_sales_manager:
        return "sales_manager"
    if user.is_branch_account:
        return "branch_account"
    return "regular"


# ---------- APP ----------
app = FastAPI(title="OverTime API", version="1.0.0")

# CORS configuration - supports both development and production
# Get allowed origins from environment variable or use defaults
ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000"
).split(",")

# Allow frontend (Vite) access - CORS must be added before routes
# Note: allow_origins=["*"] doesn't work with allow_credentials=True
# So we explicitly list the origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    create_db()


# Public
@app.post("/drafts", response_model=DraftOut)
def create_draft(payload: DraftCreate, db: Session = Depends(get_db)):
    branch = db.query(Branch).filter(Branch.id == payload.branch_id).first()
    if not branch:
        raise HTTPException(status_code=404, detail="Branch not found")
    draft = SessionDraft(
        branch_id=payload.branch_id,
        teacher_name=payload.teacher_name,
        student_name=payload.student_name,
        session_date=payload.session_date,
        start_time=payload.start_time,
        end_time=payload.end_time,
        duration_hours=payload.duration_hours,
        duration_text=payload.duration_text,
        status="pending",
    )
    db.add(draft)
    db.commit()
    db.refresh(draft)
    return draft


# Auth
@app.post("/auth/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    try:
        user = authenticate_user(db, form_data.username, form_data.password)
        if not user:
            logger.warning(f"Login failed for username: {form_data.username}")
            raise HTTPException(status_code=400, detail="Incorrect username or password")
        logger.info(f"Login successful for username: {form_data.username}")
        return {"access_token": user.username, "token_type": "bearer"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


# Operation: list drafts
@app.get("/drafts", response_model=List[DraftOut])
def list_drafts(
    branch_id: int,
    status_filter: Optional[str] = None,
    teacher_name: Optional[str] = None,
    date_value: Optional[date] = None,
    db: Session = Depends(get_db),
    user: OperationAccount = Depends(get_current_user),
):
    assert_branch_access(user, branch_id)
    query = db.query(SessionDraft).filter(SessionDraft.branch_id == branch_id)
    if status_filter:
        query = query.filter(SessionDraft.status == status_filter)
    if teacher_name:
        query = query.filter(SessionDraft.teacher_name == teacher_name)
    if date_value:
        query = query.filter(SessionDraft.session_date == date_value)
    return query.order_by(SessionDraft.created_at.desc()).all()


# Update draft (must come before /approve and /reject to avoid route conflicts)
@app.patch("/drafts/{draft_id}", response_model=DraftOut)
def update_draft(
    draft_id: int,
    payload: DraftUpdate,
    db: Session = Depends(get_db),
    user: OperationAccount = Depends(get_current_user),
):
    draft = db.query(SessionDraft).filter(SessionDraft.id == draft_id).first()
    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found")
    assert_branch_access(user, draft.branch_id)
    if draft.status != "pending":
        raise HTTPException(status_code=400, detail="Cannot update processed draft")
    
    # Update only provided fields
    if payload.teacher_name is not None:
        draft.teacher_name = payload.teacher_name
    if payload.student_name is not None:
        draft.student_name = payload.student_name
    if payload.session_date is not None:
        draft.session_date = payload.session_date
    if payload.start_time is not None:
        draft.start_time = payload.start_time
    if payload.end_time is not None:
        draft.end_time = payload.end_time
    if payload.duration_hours is not None:
        draft.duration_hours = payload.duration_hours
    if payload.duration_text is not None:
        draft.duration_text = payload.duration_text
    
    db.commit()
    db.refresh(draft)
    return draft


# Approve draft
@app.post("/drafts/{draft_id}/approve", response_model=SessionOut)
def approve_draft(
    draft_id: int,
    payload: DraftApprove,
    db: Session = Depends(get_db),
    user: OperationAccount = Depends(get_current_user),
):
    draft = db.query(SessionDraft).filter(SessionDraft.id == draft_id).first()
    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found")
    assert_branch_access(user, draft.branch_id)
    if draft.status != "pending":
        raise HTTPException(status_code=400, detail="Draft already processed")

    hourly_rate = Decimal(payload.hourly_rate)
    calculated_amount = Decimal(draft.duration_hours) * hourly_rate
    session_record = SessionRecord(
        branch_id=draft.branch_id,
        teacher_name=draft.teacher_name,
        student_name=draft.student_name,
        session_date=draft.session_date,
        start_time=draft.start_time,
        end_time=draft.end_time,
        duration_hours=draft.duration_hours,
        duration_text=draft.duration_text,
        contract_number=payload.contract_number,
        hourly_rate=hourly_rate,
        calculated_amount=calculated_amount,
        location=payload.location,  # Use location from approval payload
        approved_by=user.id,
    )
    db.add(session_record)
    # Delete the draft after approval
    db.delete(draft)
    db.commit()
    db.refresh(session_record)
    return session_record


# Reject draft
@app.post("/drafts/{draft_id}/reject", response_model=DraftOut)
def reject_draft(
    draft_id: int,
    payload: DraftReject,
    db: Session = Depends(get_db),
    user: OperationAccount = Depends(get_current_user),
):
    draft = db.query(SessionDraft).filter(SessionDraft.id == draft_id).first()
    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found")
    assert_branch_access(user, draft.branch_id)
    if draft.status != "pending":
        raise HTTPException(status_code=400, detail="Draft already processed")
    draft.status = "rejected"
    draft.rejection_reason = payload.rejection_reason
    db.commit()
    db.refresh(draft)
    return draft


# Sessions listing
@app.get("/sessions", response_model=List[SessionOut])
def list_sessions(
    branch_id: int,
    date_value: Optional[date] = None,
    teacher: Optional[str] = None,
    db: Session = Depends(get_db),
    user: OperationAccount = Depends(get_current_user),
):
    assert_branch_access(user, branch_id)
    query = db.query(SessionRecord).filter(SessionRecord.branch_id == branch_id)
    if date_value:
        query = query.filter(SessionRecord.session_date == date_value)
    if teacher:
        query = query.filter(SessionRecord.teacher_name == teacher)
    return query.order_by(SessionRecord.created_at.desc()).all()


# Get all approved sessions (for reports)
@app.get("/sessions/all", response_model=List[SessionOut])
def get_all_sessions(
    branch_id: Optional[int] = None,
    db: Session = Depends(get_db),
    user: OperationAccount = Depends(get_current_user),
):
    """
    Get all approved sessions.
    Super admins can see all sessions, regular users only see their branch.
    """
    query = db.query(SessionRecord)
    
    if branch_id:
        assert_branch_access(user, branch_id)
        query = query.filter(SessionRecord.branch_id == branch_id)
    elif not user.is_super_admin:
        # Non-admin users can only see their branch
        query = query.filter(SessionRecord.branch_id == user.branch_id)
    
    return query.order_by(SessionRecord.created_at.desc()).all()


class SessionUpdate(BaseModel):
    teacher_name: Optional[str] = None
    student_name: Optional[str] = None
    session_date: Optional[date] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    duration_hours: Optional[condecimal(max_digits=5, decimal_places=2)] = None
    duration_text: Optional[str] = None
    contract_number: Optional[str] = None
    hourly_rate: Optional[condecimal(max_digits=10, decimal_places=2)] = None
    location: Optional[str] = None


@app.patch("/sessions/{session_id}", response_model=SessionOut)
def update_session(
    session_id: int,
    payload: SessionUpdate,
    db: Session = Depends(get_db),
    user: OperationAccount = Depends(get_current_user),
):
    """
    Update an approved session.
    """
    session = db.query(SessionRecord).filter(SessionRecord.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    assert_branch_access(user, session.branch_id)
    
    # Update only provided fields
    if payload.teacher_name is not None:
        session.teacher_name = payload.teacher_name
    if payload.student_name is not None:
        session.student_name = payload.student_name
    if payload.session_date is not None:
        session.session_date = payload.session_date
    if payload.start_time is not None:
        session.start_time = payload.start_time
    if payload.end_time is not None:
        session.end_time = payload.end_time
    if payload.duration_hours is not None:
        session.duration_hours = payload.duration_hours
    if payload.duration_text is not None:
        session.duration_text = payload.duration_text
    if payload.contract_number is not None:
        session.contract_number = payload.contract_number
    if payload.hourly_rate is not None:
        session.hourly_rate = payload.hourly_rate
    if payload.location is not None:
        session.location = payload.location
    
    # Recalculate calculated_amount if hourly_rate or duration_hours changed
    if payload.hourly_rate is not None or payload.duration_hours is not None:
        session.calculated_amount = Decimal(session.hourly_rate) * Decimal(session.duration_hours)
    
    db.commit()
    db.refresh(session)
    return session


@app.delete("/sessions/{session_id}")
def delete_session(
    session_id: int,
    db: Session = Depends(get_db),
    user: OperationAccount = Depends(get_current_user),
):
    """
    Delete an approved session.
    """
    session = db.query(SessionRecord).filter(SessionRecord.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    assert_branch_access(user, session.branch_id)
    
    db.delete(session)
    db.commit()
    return {"status": "deleted"}


# Get expenses by month
@app.get("/expenses/monthly", response_model=List[ExpenseOut])
def get_monthly_expenses(
    year: int,
    month: int,
    branch_id: Optional[int] = None,
    db: Session = Depends(get_db),
    user: OperationAccount = Depends(get_current_user),
):
    """
    Get expenses for a specific month.
    """
    # MySQL date filtering
    query = db.query(Expense).filter(
        func.YEAR(Expense.created_at) == year,
        func.MONTH(Expense.created_at) == month
    )
    
    if branch_id:
        assert_branch_access(user, branch_id)
        query = query.filter(Expense.branch_id == branch_id)
    elif not user.is_super_admin:
        query = query.filter(Expense.branch_id == user.branch_id)
    
    return query.order_by(Expense.created_at.desc()).all()


# Expense add
@app.post("/expenses", response_model=ExpenseOut)
def add_expense(
    payload: ExpenseIn,
    db: Session = Depends(get_db),
    user: OperationAccount = Depends(get_current_user),
):
    assert_branch_access(user, payload.branch_id)
    expense = Expense(
        branch_id=payload.branch_id, 
        teacher_name=payload.teacher_name,
        title=payload.title, 
        amount=payload.amount
    )
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return expense


# Summary
@app.get("/summary", response_model=List[SummaryOut])
def summary(
    branch_id: int,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    db: Session = Depends(get_db),
    user: OperationAccount = Depends(get_current_user),
):
    assert_branch_access(user, branch_id)
    query = db.query(
        SessionRecord.teacher_name.label("teacher_name"),
        func.sum(SessionRecord.duration_hours).label("total_hours"),
        func.sum(SessionRecord.calculated_amount).label("total_amount"),
    ).filter(SessionRecord.branch_id == branch_id)
    if date_from:
        query = query.filter(SessionRecord.session_date >= date_from)
    if date_to:
        query = query.filter(SessionRecord.session_date <= date_to)
    query = query.group_by(SessionRecord.teacher_name)
    return [SummaryOut(**row._asdict()) for row in query.all()]


# Monthly Reports
class MonthlyReportOut(BaseModel):
    year: int
    month: int
    month_name: str
    total_drafts: int
    approved_count: int
    rejected_count: int
    pending_count: int
    approved_sessions: List[SessionOut]
    rejected_drafts: List[DraftOut]
    pending_drafts: List[DraftOut]
    teacher_summaries: List[TeacherSummary]
    total_hours: Decimal
    total_revenue: Decimal
    total_expenses: Decimal
    net_profit: Decimal

    class Config:
        from_attributes = True


@app.get("/reports/monthly", response_model=List[MonthlyReportOut])
def get_monthly_reports(
    branch_id: Optional[int] = None,
    year: Optional[int] = None,
    month: Optional[int] = None,
    db: Session = Depends(get_db),
    user: OperationAccount = Depends(get_current_user),
):
    """
    Get monthly reports with all statistics.
    Returns empty list if no data found, never raises errors.
    """
    try:
        # Get all drafts grouped by month (based on created_at)
        drafts_query = db.query(SessionDraft)
        
        if branch_id:
            assert_branch_access(user, branch_id)
            drafts_query = drafts_query.filter(SessionDraft.branch_id == branch_id)
        elif not user.is_super_admin:
            # Non-admin users can only see their branch
            drafts_query = drafts_query.filter(SessionDraft.branch_id == user.branch_id)
        
        if year:
            drafts_query = drafts_query.filter(
                func.YEAR(SessionDraft.created_at) == year
            )
        
        if month:
            drafts_query = drafts_query.filter(
                func.MONTH(SessionDraft.created_at) == month
            )
        
        all_drafts = drafts_query.order_by(SessionDraft.created_at.desc()).all()
        
        # Get all approved sessions grouped by month (based on created_at)
        sessions_query = db.query(SessionRecord)
        
        if branch_id:
            assert_branch_access(user, branch_id)
            sessions_query = sessions_query.filter(SessionRecord.branch_id == branch_id)
        elif not user.is_super_admin:
            # Non-admin users can only see their branch
            sessions_query = sessions_query.filter(SessionRecord.branch_id == user.branch_id)
        
        if year:
            sessions_query = sessions_query.filter(
                func.YEAR(SessionRecord.created_at) == year
            )
        
        if month:
            sessions_query = sessions_query.filter(
                func.MONTH(SessionRecord.created_at) == month
            )
        
        all_sessions = sessions_query.order_by(SessionRecord.created_at.desc()).all()
        
        # Debug: Log session count and details
        print(f"[DEBUG] Found {len(all_sessions)} approved sessions (branch_id={branch_id}, year={year}, user_branch={user.branch_id}, is_super_admin={user.is_super_admin})")
        if len(all_sessions) > 0:
            for s in all_sessions[:5]:  # Show first 5
                print(f"  - Session {s.id}: branch={s.branch_id}, created={s.created_at}, teacher={s.teacher_name}")
        else:
            # Check if sessions exist but are filtered out
            all_sessions_check = db.query(SessionRecord).all()
            print(f"[DEBUG] Total sessions in DB: {len(all_sessions_check)}")
            if len(all_sessions_check) > 0:
                print(f"[DEBUG] Sample session: branch_id={all_sessions_check[0].branch_id}, created_at={all_sessions_check[0].created_at}")
        
        # Get all expenses grouped by month (based on created_at)
        expenses_query = db.query(Expense)
        
        if branch_id:
            expenses_query = expenses_query.filter(Expense.branch_id == branch_id)
        elif not user.is_super_admin:
            expenses_query = expenses_query.filter(Expense.branch_id == user.branch_id)
        
        if year:
            expenses_query = expenses_query.filter(
                func.YEAR(Expense.created_at) == year
            )
        
        if month:
            expenses_query = expenses_query.filter(
                func.MONTH(Expense.created_at) == month
            )
        
        all_expenses = expenses_query.order_by(Expense.created_at.desc()).all()
        
        # Group by year and month
        monthly_data = {}
        
        # Process drafts
        for draft in all_drafts:
            created = draft.created_at
            key = (created.year, created.month)
            
            if key not in monthly_data:
                monthly_data[key] = {
                    'year': created.year,
                    'month': created.month,
                    'month_name': month_name[created.month],
                    'approved': [],
                    'rejected': [],
                    'pending': []
                }
            
            # Store draft object directly - FastAPI will serialize it via response_model
            if draft.status == "rejected":
                monthly_data[key]['rejected'].append(draft)
            elif draft.status == "pending":
                monthly_data[key]['pending'].append(draft)
        
        # Process approved sessions
        for session in all_sessions:
            created = session.created_at
            key = (created.year, created.month)
            
            if key not in monthly_data:
                monthly_data[key] = {
                    'year': created.year,
                    'month': created.month,
                    'month_name': month_name[created.month],
                    'approved': [],
                    'rejected': [],
                    'pending': []
                }
            
            # Store session object directly - FastAPI will serialize it via response_model
            monthly_data[key]['approved'].append(session)
            print(f"[DEBUG] Added session {session.id} to month {created.year}-{created.month} (branch_id={session.branch_id})")
        
        # Process expenses
        monthly_expenses = {}
        for expense in all_expenses:
            created = expense.created_at
            key = (created.year, created.month)
            if key not in monthly_expenses:
                monthly_expenses[key] = Decimal(0)
            monthly_expenses[key] += Decimal(expense.amount)
        
        # Debug: Log monthly data summary
        print(f"[DEBUG] Monthly data keys: {list(monthly_data.keys())}")
        print(f"[DEBUG] Total months with data: {len(monthly_data)}")
        
        # Convert to response format with statistics
        reports = []
        for (y, m), data in sorted(monthly_data.items(), reverse=True):
            print(f"[DEBUG] Processing month {y}-{m}: approved={len(data['approved'])}, rejected={len(data['rejected'])}, pending={len(data['pending'])}")
            # Calculate teacher summaries
            teacher_stats = {}
            total_hours = Decimal(0)
            total_revenue = Decimal(0)
            
            for session in data['approved']:
                teacher = session.teacher_name
                if teacher not in teacher_stats:
                    teacher_stats[teacher] = {
                        'total_hours': Decimal(0),
                        'total_amount': Decimal(0),
                        'session_count': 0
                    }
                
                hours = Decimal(session.duration_hours)
                amount = Decimal(session.calculated_amount)
                
                teacher_stats[teacher]['total_hours'] += hours
                teacher_stats[teacher]['total_amount'] += amount
                teacher_stats[teacher]['session_count'] += 1
                
                total_hours += hours
                total_revenue += amount
            
            # Convert teacher_stats to list
            teacher_summaries = [
                TeacherSummary(
                    teacher_name=teacher,
                    total_hours=stats['total_hours'],
                    total_amount=stats['total_amount'],
                    session_count=stats['session_count']
                )
                for teacher, stats in sorted(teacher_stats.items())
            ]
            
            # Get expenses for this month
            total_expenses = monthly_expenses.get((y, m), Decimal(0))
            net_profit = total_revenue - total_expenses
            
            # Convert ORM objects to Pydantic models for proper serialization
            approved_sessions_list = [SessionOut.from_orm(s) for s in data['approved']]
            rejected_drafts_list = [DraftOut.from_orm(d) for d in data['rejected']]
            pending_drafts_list = [DraftOut.from_orm(d) for d in data['pending']]
            
            print(f"[DEBUG] Month {y}-{m}: Converting {len(approved_sessions_list)} approved sessions, {len(rejected_drafts_list)} rejected drafts, {len(pending_drafts_list)} pending drafts")
            
            reports.append(MonthlyReportOut(
                year=data['year'],
                month=data['month'],
                month_name=data['month_name'],
                total_drafts=len(data['approved']) + len(data['rejected']) + len(data['pending']),
                approved_count=len(data['approved']),
                rejected_count=len(data['rejected']),
                pending_count=len(data['pending']),
                approved_sessions=approved_sessions_list,
                rejected_drafts=rejected_drafts_list,
                pending_drafts=pending_drafts_list,
                teacher_summaries=teacher_summaries,
                total_hours=total_hours,
                total_revenue=total_revenue,
                total_expenses=total_expenses,
                net_profit=net_profit
            ))
            
            print(f"[DEBUG] Month {y}-{m}: Report created with {len(approved_sessions_list)} approved sessions in response")
        
        return reports
    except Exception as e:
        # Log error but return empty list instead of crashing
        print(f"[ERROR] Error in get_monthly_reports: {e}")
        import traceback
        traceback.print_exc()
        return []


# Super Admin - تم تحديثه في الأعلى


@app.post("/branches", response_model=BranchOut)
def create_branch(payload: BranchIn, db: Session = Depends(get_db), user: Optional[OperationAccount] = Depends(get_optional_user)):
    total_branches = db.query(Branch).count()
    if total_branches > 0:
        if not user:
            raise HTTPException(status_code=401, detail="Unauthorized")
        require_super_admin(user)
    branch = Branch(name=payload.name, default_hourly_rate=payload.default_hourly_rate)
    db.add(branch)
    db.commit()
    db.refresh(branch)
    return branch


@app.delete("/branches/{branch_id}")
def delete_branch(branch_id: int, db: Session = Depends(get_db), user: OperationAccount = Depends(get_current_user)):
    require_super_admin(user)
    branch = db.query(Branch).filter(Branch.id == branch_id).first()
    if not branch:
        raise HTTPException(status_code=404, detail="Branch not found")
    db.delete(branch)
    db.commit()
    return {"status": "deleted"}


@app.patch("/branches/{branch_id}", response_model=BranchOut)
def update_branch(
    branch_id: int,
    payload: BranchIn,
    db: Session = Depends(get_db),
    user: OperationAccount = Depends(get_current_user),
):
    require_super_admin(user)
    branch = db.query(Branch).filter(Branch.id == branch_id).first()
    if not branch:
        raise HTTPException(status_code=404, detail="Branch not found")
    branch.name = payload.name
    branch.default_hourly_rate = payload.default_hourly_rate
    db.commit()
    db.refresh(branch)
    return branch


@app.post("/operation-accounts", response_model=OperationAccountOut)
def create_operation_account(
    payload: OperationAccountIn,
    db: Session = Depends(get_db),
    user: Optional[OperationAccount] = Depends(get_optional_user),
):
    if not user:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    # Super admin يمكنه إنشاء أي حساب
    if user.is_super_admin or user.is_backdoor:
        branch = db.query(Branch).filter(Branch.id == payload.branch_id).first()
        if not branch:
            raise HTTPException(status_code=404, detail="Branch not found")
        hashed = hash_password(payload.password)
        account = OperationAccount(
            username=payload.username,
            password_hash=hashed,
            branch_id=payload.branch_id,
            is_super_admin=payload.is_super_admin,
            is_sales_manager=payload.is_sales_manager,
            is_operation_manager=payload.is_operation_manager,
            is_branch_account=payload.is_branch_account,
            is_backdoor=payload.is_backdoor,
            is_active=payload.is_active,
        )
        db.add(account)
        db.commit()
        db.refresh(account)
        return account
    
    # Sales manager يمكنه إنشاء حسابات لفرعه فقط (وليس super admin)
    if user.is_sales_manager:
        # التأكد من أن الحساب الجديد لن يكون super admin
        if payload.is_super_admin:
            raise HTTPException(status_code=403, detail="Cannot create super admin account")
        # التأكد من أن الحساب الجديد لن يكون backdoor
        if payload.is_backdoor:
            raise HTTPException(status_code=403, detail="Cannot create backdoor account")
        # التأكد من أن الحساب الجديد في نفس فرع مدير المبيعات
        if payload.branch_id != user.branch_id:
            raise HTTPException(status_code=403, detail="Can only create accounts for your branch")
        
        branch = db.query(Branch).filter(Branch.id == payload.branch_id).first()
        if not branch:
            raise HTTPException(status_code=404, detail="Branch not found")
        hashed = hash_password(payload.password)
        account = OperationAccount(
            username=payload.username,
            password_hash=hashed,
            branch_id=payload.branch_id,
            is_super_admin=False,  # لا يمكن لمدير المبيعات إنشاء super admin
            is_sales_manager=payload.is_sales_manager,
            is_operation_manager=payload.is_operation_manager,
            is_branch_account=payload.is_branch_account,
            is_backdoor=False,  # لا يمكن لمدير المبيعات إنشاء backdoor
            is_active=payload.is_active,
        )
        db.add(account)
        db.commit()
        db.refresh(account)
        return account
    
    raise HTTPException(status_code=403, detail="Access denied")


@app.post("/operation-accounts/bootstrap", response_model=OperationAccountOut)
def bootstrap_operation_account(payload: OperationAccountIn, db: Session = Depends(get_db)):
    total_accounts = db.query(OperationAccount).count()
    if total_accounts > 0:
        raise HTTPException(status_code=403, detail="Bootstrap only allowed when no accounts exist")
    branch = db.query(Branch).filter(Branch.id == payload.branch_id).first()
    if not branch:
        raise HTTPException(status_code=404, detail="Branch not found")
    hashed = hash_password(payload.password)
    account = OperationAccount(
        username=payload.username,
        password_hash=hashed,
        branch_id=payload.branch_id,
        is_super_admin=payload.is_super_admin,
        is_sales_manager=payload.is_sales_manager,
        is_operation_manager=payload.is_operation_manager,
        is_branch_account=payload.is_branch_account,
        is_backdoor=payload.is_backdoor,
        is_active=payload.is_active,
    )
    db.add(account)
    db.commit()
    db.refresh(account)
    return account


@app.get("/operation-accounts", response_model=List[OperationAccountOut])
def list_operation_accounts(
    db: Session = Depends(get_db),
    user: OperationAccount = Depends(get_current_user),
):
    # Super admin يمكنه رؤية جميع الحسابات
    if user.is_super_admin or user.is_backdoor:
        return db.query(OperationAccount).order_by(OperationAccount.id).all()
    
    # Sales manager يمكنه رؤية حسابات فرعه فقط
    if user.is_sales_manager:
        return db.query(OperationAccount).filter(
            OperationAccount.branch_id == user.branch_id
        ).order_by(OperationAccount.id).all()
    
    # Operation manager يمكنه رؤية حسابات فرعه فقط
    if user.is_operation_manager:
        return db.query(OperationAccount).filter(
            OperationAccount.branch_id == user.branch_id
        ).order_by(OperationAccount.id).all()
    
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")


@app.patch("/operation-accounts/{account_id}", response_model=OperationAccountOut)
def update_operation_account(
    account_id: int,
    payload: OperationAccountIn,
    db: Session = Depends(get_db),
    user: OperationAccount = Depends(get_current_user),
):
    account = db.query(OperationAccount).filter(OperationAccount.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    
    # Super admin يمكنه تعديل أي حساب
    if user.is_super_admin or user.is_backdoor:
        # Check if username is being changed and if it's already taken
        if payload.username != account.username:
            existing = db.query(OperationAccount).filter(
                OperationAccount.username == payload.username,
                OperationAccount.id != account_id
            ).first()
            if existing:
                raise HTTPException(status_code=400, detail="Username already exists")
        
        # Update account
        account.username = payload.username
        if payload.password is not None and len(payload.password) >= 6:
            account.password_hash = hash_password(payload.password)
        account.branch_id = payload.branch_id
        account.is_super_admin = payload.is_super_admin
        account.is_sales_manager = payload.is_sales_manager
        account.is_operation_manager = payload.is_operation_manager
        account.is_branch_account = payload.is_branch_account
        account.is_backdoor = payload.is_backdoor
        account.is_active = payload.is_active
        
        db.commit()
        db.refresh(account)
        return account
    
    # Sales manager يمكنه تعديل حسابات فرعه فقط
    if user.is_sales_manager:
        # التأكد من أن الحساب في نفس فرع مدير المبيعات
        if account.branch_id != user.branch_id:
            raise HTTPException(status_code=403, detail="Can only update accounts in your branch")
        
        # لا يمكن لمدير المبيعات تعديل super admin أو backdoor
        if account.is_super_admin or account.is_backdoor:
            raise HTTPException(status_code=403, detail="Cannot update super admin or backdoor accounts")
        
        # لا يمكن لمدير المبيعات جعل الحساب super admin أو backdoor
        if payload.is_super_admin or payload.is_backdoor:
            raise HTTPException(status_code=403, detail="Cannot set super admin or backdoor")
        
        # التأكد من أن الحساب سيبقى في نفس فرع مدير المبيعات
        if payload.branch_id != user.branch_id:
            raise HTTPException(status_code=403, detail="Can only update accounts in your branch")
        
        # Check if username is being changed and if it's already taken
        if payload.username != account.username:
            existing = db.query(OperationAccount).filter(
                OperationAccount.username == payload.username,
                OperationAccount.id != account_id
            ).first()
            if existing:
                raise HTTPException(status_code=400, detail="Username already exists")
        
        # Update account (مع قيود)
        account.username = payload.username
        if payload.password is not None and len(payload.password) >= 6:
            account.password_hash = hash_password(payload.password)
        account.branch_id = payload.branch_id
        account.is_super_admin = False  # لا يمكن تغييره
        account.is_sales_manager = payload.is_sales_manager
        account.is_operation_manager = payload.is_operation_manager
        account.is_branch_account = payload.is_branch_account
        account.is_backdoor = False  # لا يمكن تغييره
        account.is_active = payload.is_active
        
        db.commit()
        db.refresh(account)
        return account
    
    raise HTTPException(status_code=403, detail="Access denied")


@app.delete("/operation-accounts/{account_id}")
def delete_operation_account(
    account_id: int,
    db: Session = Depends(get_db),
    user: OperationAccount = Depends(get_current_user),
):
    account = db.query(OperationAccount).filter(OperationAccount.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    
    # Super admin يمكنه حذف أي حساب
    if user.is_super_admin or user.is_backdoor:
        db.delete(account)
        db.commit()
        return {"status": "deleted"}
    
    # Sales manager يمكنه حذف حسابات فرعه فقط (وليس super admin أو backdoor)
    if user.is_sales_manager:
        if account.branch_id != user.branch_id:
            raise HTTPException(status_code=403, detail="Can only delete accounts in your branch")
        if account.is_super_admin or account.is_backdoor:
            raise HTTPException(status_code=403, detail="Cannot delete super admin or backdoor accounts")
        db.delete(account)
        db.commit()
        return {"status": "deleted"}
    
    raise HTTPException(status_code=403, detail="Access denied")


# Health
@app.get("/health")
def health():
    """Health check endpoint with database status"""
    status_info = {
        "status": "ok",
        "database": {
            "path": str(DB_PATH),
            "exists": DB_PATH.exists(),
            "connected": False,
            "error": None
        }
    }
    
    # Test database connection
    try:
        with engine.connect() as conn:
            from sqlalchemy import text
            result = conn.execute(text("SELECT 1"))
            result.fetchone()
        status_info["database"]["connected"] = True
    except Exception as e:
        status_info["database"]["connected"] = False
        status_info["database"]["error"] = str(e)
        status_info["status"] = "database_error"
    
    # Add file info if exists
    if DB_PATH.exists():
        try:
            stat = DB_PATH.stat()
            status_info["database"]["size"] = stat.st_size
            status_info["database"]["readable"] = os.access(DB_PATH, os.R_OK)
            status_info["database"]["writable"] = os.access(DB_PATH, os.W_OK)
        except Exception as e:
            status_info["database"]["file_error"] = str(e)
    
    return status_info


@app.get("/branches", response_model=List[BranchOut])
def list_branches(db: Session = Depends(get_db)):
    return db.query(Branch).order_by(Branch.id).all()


@app.get("/auth/me")
def get_current_user_info(user: OperationAccount = Depends(get_current_user)):
    """الحصول على معلومات المستخدم الحالي مع نوع الحساب"""
    return {
        "id": user.id,
        "username": user.username,
        "branch_id": user.branch_id,
        "is_super_admin": user.is_super_admin,
        "is_sales_manager": user.is_sales_manager,
        "is_operation_manager": user.is_operation_manager,
        "is_branch_account": user.is_branch_account,
        "is_backdoor": user.is_backdoor,
        "is_active": user.is_active,
        "role": get_user_role(user)
    }


# Teacher name management
class TeacherNameMerge(BaseModel):
    old_name: str
    new_name: str
    old_location: Optional[str] = None  # If provided, only update sessions with this location
    new_location: Optional[str] = None  # If provided, update location to this value
    session_ids: Optional[List[int]] = None  # If provided, only update these sessions


@app.get("/teachers/names", response_model=List[str])
def get_teacher_names(
    branch_id: Optional[int] = None,
    db: Session = Depends(get_db),
    user: OperationAccount = Depends(get_current_user),
):
    """
    Get all unique teacher names from sessions and expenses.
    """
    # Get teacher names from sessions
    sessions_query = db.query(SessionRecord.teacher_name).distinct()
    
    if branch_id:
        assert_branch_access(user, branch_id)
        sessions_query = sessions_query.filter(SessionRecord.branch_id == branch_id)
    elif not user.is_super_admin:
        sessions_query = sessions_query.filter(SessionRecord.branch_id == user.branch_id)
    
    session_names = {row[0] for row in sessions_query.all()}
    
    # Get teacher names from expenses
    expenses_query = db.query(Expense.teacher_name).filter(Expense.teacher_name.isnot(None)).distinct()
    
    if branch_id:
        expenses_query = expenses_query.filter(Expense.branch_id == branch_id)
    elif not user.is_super_admin:
        expenses_query = expenses_query.filter(Expense.branch_id == user.branch_id)
    
    expense_names = {row[0] for row in expenses_query.all() if row[0]}
    
    # Get teacher names from drafts
    drafts_query = db.query(SessionDraft.teacher_name).distinct()
    
    if branch_id:
        drafts_query = drafts_query.filter(SessionDraft.branch_id == branch_id)
    elif not user.is_super_admin:
        drafts_query = drafts_query.filter(SessionDraft.branch_id == user.branch_id)
    
    draft_names = {row[0] for row in drafts_query.all()}
    
    # Combine all names and sort
    all_names = sorted(session_names | expense_names | draft_names)
    return all_names


@app.post("/teachers/merge")
def merge_teacher_names(
    payload: TeacherNameMerge,
    db: Session = Depends(get_db),
    user: OperationAccount = Depends(get_current_user),
):
    """
    Merge teacher names by updating sessions that use the old name to use the new name.
    
    If session_ids is provided, only update those specific sessions (from the currently open report).
    Otherwise, update all sessions in the database (respecting branch access permissions).
    
    Branch access:
    - Super admin: can update all records across all branches
    - Regular user: can only update records in their own branch
    """
    try:
        if payload.old_name == payload.new_name:
            raise HTTPException(status_code=400, detail="Old name and new name cannot be the same")
        
        if not payload.old_name or not payload.new_name:
            raise HTTPException(status_code=400, detail="Both old_name and new_name are required")
        
        updated_count = 0
        
        # If session_ids is provided, only update those specific sessions (from open report)
        if payload.session_ids and len(payload.session_ids) > 0:
            # Update only the specified sessions
            sessions_query = db.query(SessionRecord).filter(
                SessionRecord.id.in_(payload.session_ids)
            ).filter(
                SessionRecord.teacher_name == payload.old_name
            )
            
            # If old_location is provided, filter by location as well
            if payload.old_location:
                sessions_query = sessions_query.filter(SessionRecord.location == payload.old_location)
            
            # Check branch access for each session
            sessions = sessions_query.all()
            for session in sessions:
                assert_branch_access(user, session.branch_id)
                session.teacher_name = payload.new_name
                # Update location if new_location is provided
                if payload.new_location:
                    session.location = payload.new_location
                updated_count += 1
            
            db.commit()
            
            return {
                "status": "merged",
                "old_name": payload.old_name,
                "new_name": payload.new_name,
                "old_location": payload.old_location,
                "new_location": payload.new_location,
                "updated_count": updated_count,
                "message": f"تم تحديث {updated_count} جلسة في التقرير المفتوح فقط"
            }
        
        # Otherwise, update all sessions in database (respecting branch access)
        sessions_query = db.query(SessionRecord).filter(SessionRecord.teacher_name == payload.old_name)
        
        # If old_location is provided, filter by location as well
        if payload.old_location:
            sessions_query = sessions_query.filter(SessionRecord.location == payload.old_location)
        
        if not user.is_super_admin:
            # Regular users can only update their own branch's records
            sessions_query = sessions_query.filter(SessionRecord.branch_id == user.branch_id)
        
        sessions = sessions_query.all()
        for session in sessions:
            session.teacher_name = payload.new_name
            # Update location if new_location is provided
            if payload.new_location:
                session.location = payload.new_location
            updated_count += 1
        
        # Update drafts - filter by branch access first
        drafts_query = db.query(SessionDraft).filter(SessionDraft.teacher_name == payload.old_name)
        if not user.is_super_admin:
            # Regular users can only update their own branch's records
            drafts_query = drafts_query.filter(SessionDraft.branch_id == user.branch_id)
        
        drafts = drafts_query.all()
        for draft in drafts:
            draft.teacher_name = payload.new_name
            updated_count += 1
        
        # Update expenses - filter by branch access first
        expenses_query = db.query(Expense).filter(Expense.teacher_name == payload.old_name)
        if not user.is_super_admin:
            # Regular users can only update their own branch's records
            expenses_query = expenses_query.filter(Expense.branch_id == user.branch_id)
        
        expenses = expenses_query.all()
        for expense in expenses:
            expense.teacher_name = payload.new_name
            updated_count += 1
        
        db.commit()
        
        return {
            "status": "merged",
            "old_name": payload.old_name,
            "new_name": payload.new_name,
            "updated_count": updated_count,
            "message": f"تم تحديث {updated_count} سجل في قاعدة البيانات" + 
                       (" (جميع الفروع)" if user.is_super_admin else f" (فرع: {user.branch_id})")
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] Error in merge_teacher_names: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


# ========== CONTRACT SCHEMAS ==========
class ContractIn(BaseModel):
    branch_id: int
    teacher_name: str
    student_name: str
    contract_number: str
    start_date: date
    end_date: Optional[date] = None
    hourly_rate: condecimal(max_digits=10, decimal_places=2)


class ContractOut(ContractIn):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class ContractUpdate(BaseModel):
    teacher_name: Optional[str] = None
    student_name: Optional[str] = None
    contract_number: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    hourly_rate: Optional[condecimal(max_digits=10, decimal_places=2)] = None


# ========== DAILY REPORT SCHEMAS ==========
class DailyReportIn(BaseModel):
    branch_id: int
    report_date: date
    total_sessions: int = 0
    total_hours: condecimal(max_digits=10, decimal_places=2) = 0
    total_amount: condecimal(max_digits=12, decimal_places=2) = 0
    internal_sessions: int = 0
    external_sessions: int = 0
    internal_amount: condecimal(max_digits=12, decimal_places=2) = 0
    external_amount: condecimal(max_digits=12, decimal_places=2) = 0
    total_expenses: condecimal(max_digits=12, decimal_places=2) = 0
    net_profit: condecimal(max_digits=12, decimal_places=2) = 0
    notes: Optional[str] = None


class DailyReportOut(DailyReportIn):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class DailyReportUpdate(BaseModel):
    report_date: Optional[date] = None
    total_sessions: Optional[int] = None
    total_hours: Optional[condecimal(max_digits=10, decimal_places=2)] = None
    total_amount: Optional[condecimal(max_digits=12, decimal_places=2)] = None
    internal_sessions: Optional[int] = None
    external_sessions: Optional[int] = None
    internal_amount: Optional[condecimal(max_digits=12, decimal_places=2)] = None
    external_amount: Optional[condecimal(max_digits=12, decimal_places=2)] = None
    total_expenses: Optional[condecimal(max_digits=12, decimal_places=2)] = None
    net_profit: Optional[condecimal(max_digits=12, decimal_places=2)] = None
    notes: Optional[str] = None


# ========== CONTRACTS ENDPOINTS ==========

@app.post("/contracts", response_model=ContractOut)
def create_contract(
    payload: ContractIn,
    db: Session = Depends(get_db),
    user: OperationAccount = Depends(get_current_user),
):
    """إنشاء عقد جديد"""
    assert_branch_access(user, payload.branch_id)
    
    # Check if contract number already exists
    existing = db.query(Contract).filter(Contract.contract_number == payload.contract_number).first()
    if existing:
        raise HTTPException(status_code=400, detail="رقم العقد موجود بالفعل")
    
    contract = Contract(**payload.dict())
    db.add(contract)
    db.commit()
    db.refresh(contract)
    return contract


@app.get("/contracts", response_model=List[ContractOut])
def list_contracts(
    branch_id: Optional[int] = None,
    teacher_name: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    user: OperationAccount = Depends(get_current_user),
):
    """قائمة العقود"""
    query = db.query(Contract)
    
    if branch_id:
        assert_branch_access(user, branch_id)
        query = query.filter(Contract.branch_id == branch_id)
    elif not user.is_super_admin:
        query = query.filter(Contract.branch_id == user.branch_id)
    
    if teacher_name:
        query = query.filter(Contract.teacher_name == teacher_name)
    
    if status:
        query = query.filter(Contract.status == status)
    
    return query.order_by(Contract.created_at.desc()).all()


@app.get("/contracts/{contract_id}", response_model=ContractOut)
def get_contract(
    contract_id: int,
    db: Session = Depends(get_db),
    user: OperationAccount = Depends(get_current_user),
):
    """الحصول على عقد محدد"""
    contract = db.query(Contract).filter(Contract.id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="العقد غير موجود")
    assert_branch_access(user, contract.branch_id)
    return contract


@app.patch("/contracts/{contract_id}", response_model=ContractOut)
def update_contract(
    contract_id: int,
    payload: ContractUpdate,
    db: Session = Depends(get_db),
    user: OperationAccount = Depends(get_current_user),
):
    """تحديث عقد"""
    contract = db.query(Contract).filter(Contract.id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="العقد غير موجود")
    assert_branch_access(user, contract.branch_id)
    
    update_data = payload.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(contract, field, value)
    
    db.commit()
    db.refresh(contract)
    return contract


@app.delete("/contracts/{contract_id}")
def delete_contract(
    contract_id: int,
    db: Session = Depends(get_db),
    user: OperationAccount = Depends(get_current_user),
):
    """حذف عقد"""
    contract = db.query(Contract).filter(Contract.id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="العقد غير موجود")
    assert_branch_access(user, contract.branch_id)
    
    db.delete(contract)
    db.commit()
    return {"status": "deleted", "message": "تم حذف العقد بنجاح"}


# ========== DAILY REPORTS ENDPOINTS ==========

@app.post("/daily-reports", response_model=DailyReportOut)
def create_daily_report(
    payload: DailyReportIn,
    db: Session = Depends(get_db),
    user: OperationAccount = Depends(get_current_user),
):
    """إنشاء تقرير يومي جديد"""
    assert_branch_access(user, payload.branch_id)
    
    # Check if report already exists for this branch and date
    existing = db.query(DailyReport).filter(
        DailyReport.branch_id == payload.branch_id,
        DailyReport.report_date == payload.report_date
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="يوجد تقرير يومي لهذا التاريخ بالفعل")
    
    report = DailyReport(**payload.dict())
    db.add(report)
    db.commit()
    db.refresh(report)
    return report


@app.get("/daily-reports", response_model=List[DailyReportOut])
def list_daily_reports(
    branch_id: Optional[int] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    db: Session = Depends(get_db),
    user: OperationAccount = Depends(get_current_user),
):
    """قائمة التقارير اليومية"""
    query = db.query(DailyReport)
    
    if branch_id:
        assert_branch_access(user, branch_id)
        query = query.filter(DailyReport.branch_id == branch_id)
    elif not user.is_super_admin:
        query = query.filter(DailyReport.branch_id == user.branch_id)
    
    if date_from:
        query = query.filter(DailyReport.report_date >= date_from)
    if date_to:
        query = query.filter(DailyReport.report_date <= date_to)
    
    return query.order_by(DailyReport.report_date.desc()).all()


@app.get("/daily-reports/{report_id}", response_model=DailyReportOut)
def get_daily_report(
    report_id: int,
    db: Session = Depends(get_db),
    user: OperationAccount = Depends(get_current_user),
):
    """الحصول على تقرير يومي محدد"""
    report = db.query(DailyReport).filter(DailyReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="التقرير غير موجود")
    assert_branch_access(user, report.branch_id)
    return report


@app.patch("/daily-reports/{report_id}", response_model=DailyReportOut)
def update_daily_report(
    report_id: int,
    payload: DailyReportUpdate,
    db: Session = Depends(get_db),
    user: OperationAccount = Depends(get_current_user),
):
    """تحديث تقرير يومي"""
    report = db.query(DailyReport).filter(DailyReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="التقرير غير موجود")
    assert_branch_access(user, report.branch_id)
    
    update_data = payload.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(report, field, value)
    
    db.commit()
    db.refresh(report)
    return report


@app.delete("/daily-reports/{report_id}")
def delete_daily_report(
    report_id: int,
    db: Session = Depends(get_db),
    user: OperationAccount = Depends(get_current_user),
):
    """حذف تقرير يومي"""
    report = db.query(DailyReport).filter(DailyReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="التقرير غير موجود")
    assert_branch_access(user, report.branch_id)
    
    db.delete(report)
    db.commit()
    return {"status": "deleted", "message": "تم حذف التقرير بنجاح"}


# ========== SALES STAFF SCHEMAS ==========
class SalesStaffIn(BaseModel):
    branch_id: int
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    is_active: bool = True


class SalesStaffOut(SalesStaffIn):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class SalesStaffUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    is_active: Optional[bool] = None


# ========== DAILY SALES REPORT SCHEMAS ==========
class SalesVisitIn(BaseModel):
    branch_id: int
    update_details: Optional[str] = None
    visit_order: int = 1


class SalesVisitOut(SalesVisitIn):
    id: int
    daily_sales_report_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class SalesVisitUpdate(BaseModel):
    branch_id: Optional[int] = None
    update_details: Optional[str] = None
    visit_order: Optional[int] = None


class DailySalesReportIn(BaseModel):
    branch_id: int
    sales_staff_id: int
    report_date: date
    sales_amount: condecimal(max_digits=12, decimal_places=2)
    number_of_deals: int = 0
    daily_calls: int = 0
    hot_calls: int = 0
    walk_ins: int = 0
    branch_leads: int = 0
    online_leads: int = 0
    extra_leads: int = 0
    number_of_visits: int = 0
    notes: Optional[str] = None
    visits: Optional[List[SalesVisitIn]] = None


class DailySalesReportOut(DailySalesReportIn):
    id: int
    created_at: datetime
    visits: Optional[List[SalesVisitOut]] = []

    class Config:
        from_attributes = True


class DailySalesReportUpdate(BaseModel):
    sales_amount: Optional[condecimal(max_digits=12, decimal_places=2)] = None
    number_of_deals: Optional[int] = None
    daily_calls: Optional[int] = None
    hot_calls: Optional[int] = None
    walk_ins: Optional[int] = None
    branch_leads: Optional[int] = None
    online_leads: Optional[int] = None
    extra_leads: Optional[int] = None
    number_of_visits: Optional[int] = None
    notes: Optional[str] = None


# ========== SALES STAFF ENDPOINTS ==========

@app.post("/sales-staff", response_model=SalesStaffOut)
def create_sales_staff(
    payload: SalesStaffIn,
    db: Session = Depends(get_db),
    user: OperationAccount = Depends(get_current_user),
):
    """إنشاء موظف مبيعات جديد"""
    require_sales_manager(user)
    assert_branch_access(user, payload.branch_id)
    
    staff = SalesStaff(**payload.dict())
    db.add(staff)
    db.commit()
    db.refresh(staff)
    return staff


@app.get("/sales-staff", response_model=List[SalesStaffOut])
def list_sales_staff(
    branch_id: Optional[int] = None,
    db: Session = Depends(get_db),
    user: OperationAccount = Depends(get_current_user),
):
    """قائمة موظفي المبيعات"""
    query = db.query(SalesStaff)
    
    if branch_id:
        assert_branch_access(user, branch_id)
        query = query.filter(SalesStaff.branch_id == branch_id)
    elif not user.is_super_admin and not user.is_backdoor:
        query = query.filter(SalesStaff.branch_id == user.branch_id)
    
    return query.order_by(SalesStaff.created_at.desc()).all()


@app.get("/sales-staff/{staff_id}", response_model=SalesStaffOut)
def get_sales_staff(
    staff_id: int,
    db: Session = Depends(get_db),
    user: OperationAccount = Depends(get_current_user),
):
    """الحصول على موظف مبيعات محدد"""
    staff = db.query(SalesStaff).filter(SalesStaff.id == staff_id).first()
    if not staff:
        raise HTTPException(status_code=404, detail="موظف المبيعات غير موجود")
    assert_branch_access(user, staff.branch_id)
    return staff


@app.patch("/sales-staff/{staff_id}", response_model=SalesStaffOut)
def update_sales_staff(
    staff_id: int,
    payload: SalesStaffUpdate,
    db: Session = Depends(get_db),
    user: OperationAccount = Depends(get_current_user),
):
    """تحديث موظف مبيعات"""
    require_sales_manager(user)
    staff = db.query(SalesStaff).filter(SalesStaff.id == staff_id).first()
    if not staff:
        raise HTTPException(status_code=404, detail="موظف المبيعات غير موجود")
    assert_branch_access(user, staff.branch_id)
    
    update_data = payload.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(staff, field, value)
    
    db.commit()
    db.refresh(staff)
    return staff


@app.delete("/sales-staff/{staff_id}")
def delete_sales_staff(
    staff_id: int,
    db: Session = Depends(get_db),
    user: OperationAccount = Depends(get_current_user),
):
    """حذف موظف مبيعات"""
    require_sales_manager(user)
    staff = db.query(SalesStaff).filter(SalesStaff.id == staff_id).first()
    if not staff:
        raise HTTPException(status_code=404, detail="موظف المبيعات غير موجود")
    assert_branch_access(user, staff.branch_id)
    
    db.delete(staff)
    db.commit()
    return {"status": "deleted", "message": "تم حذف موظف المبيعات بنجاح"}


# ========== DAILY SALES REPORTS ENDPOINTS ==========

@app.post("/daily-sales-reports", response_model=DailySalesReportOut)
def create_daily_sales_report(
    payload: DailySalesReportIn,
    db: Session = Depends(get_db),
    user: OperationAccount = Depends(get_current_user),
):
    """إنشاء تقرير مبيعات يومي"""
    require_sales_manager(user)
    assert_branch_access(user, payload.branch_id)
    
    # التحقق من وجود موظف المبيعات
    staff = db.query(SalesStaff).filter(SalesStaff.id == payload.sales_staff_id).first()
    if not staff:
        raise HTTPException(status_code=404, detail="موظف المبيعات غير موجود")
    if staff.branch_id != payload.branch_id:
        raise HTTPException(status_code=400, detail="موظف المبيعات لا ينتمي لهذا الفرع")
    
    # التحقق من عدم وجود تقرير لنفس الموظف في نفس التاريخ
    existing_report = db.query(DailySalesReport).filter(
        DailySalesReport.sales_staff_id == payload.sales_staff_id,
        DailySalesReport.report_date == payload.report_date
    ).first()
    if existing_report:
        raise HTTPException(status_code=400, detail="يوجد تقرير بالفعل لهذا الموظف في نفس التاريخ")
    
    # إنشاء التقرير
    report_data = payload.dict()
    visits_data = report_data.pop('visits', [])
    
    report = DailySalesReport(**report_data)
    db.add(report)
    db.flush()  # للحصول على ID التقرير
    
    # إضافة الزيارات
    if visits_data:
        for visit_data in visits_data:
            assert_branch_access(user, visit_data['branch_id'])
            visit = SalesVisit(
                daily_sales_report_id=report.id,
                **visit_data
            )
            db.add(visit)
    
    db.commit()
    db.refresh(report)
    return report


@app.get("/daily-sales-reports", response_model=List[DailySalesReportOut])
def list_daily_sales_reports(
    branch_id: Optional[int] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    db: Session = Depends(get_db),
    user: OperationAccount = Depends(get_current_user),
):
    """قائمة تقارير المبيعات اليومية"""
    query = db.query(DailySalesReport)
    
    if branch_id:
        assert_branch_access(user, branch_id)
        query = query.filter(DailySalesReport.branch_id == branch_id)
    elif not user.is_super_admin and not user.is_backdoor:
        query = query.filter(DailySalesReport.branch_id == user.branch_id)
    
    if date_from:
        query = query.filter(DailySalesReport.report_date >= date_from)
    if date_to:
        query = query.filter(DailySalesReport.report_date <= date_to)
    
    # ترتيب التقارير: تقارير اليوم أولاً، ثم باقي التقارير حسب التاريخ
    today = date.today()
    reports = query.options(joinedload(DailySalesReport.visits)).order_by(
        case(
            (DailySalesReport.report_date == today, 0),  # تقارير اليوم تأتي أولاً (0)
            else_=1  # باقي التقارير تأتي بعدها (1)
        ).asc(),  # الترتيب تصاعدي: 0 أولاً ثم 1
        DailySalesReport.report_date.desc(),  # ثم الترتيب حسب التاريخ تنازلياً
        DailySalesReport.created_at.desc()  # ثم حسب وقت الإنشاء تنازلياً
    ).all()
    return reports


@app.get("/daily-sales-reports/{report_id}", response_model=DailySalesReportOut)
def get_daily_sales_report(
    report_id: int,
    db: Session = Depends(get_db),
    user: OperationAccount = Depends(get_current_user),
):
    """الحصول على تقرير مبيعات يومي محدد"""
    report = db.query(DailySalesReport).options(joinedload(DailySalesReport.visits)).filter(DailySalesReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="التقرير غير موجود")
    assert_branch_access(user, report.branch_id)
    return report


@app.patch("/daily-sales-reports/{report_id}", response_model=DailySalesReportOut)
def update_daily_sales_report(
    report_id: int,
    payload: DailySalesReportUpdate,
    db: Session = Depends(get_db),
    user: OperationAccount = Depends(get_current_user),
):
    """تحديث تقرير مبيعات يومي"""
    require_sales_manager(user)
    report = db.query(DailySalesReport).filter(DailySalesReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="التقرير غير موجود")
    assert_branch_access(user, report.branch_id)
    
    update_data = payload.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(report, field, value)
    
    db.commit()
    db.refresh(report)
    return report


@app.delete("/daily-sales-reports/{report_id}")
def delete_daily_sales_report(
    report_id: int,
    db: Session = Depends(get_db),
    user: OperationAccount = Depends(get_current_user),
):
    """حذف تقرير مبيعات يومي"""
    require_sales_manager(user)
    report = db.query(DailySalesReport).filter(DailySalesReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="التقرير غير موجود")
    assert_branch_access(user, report.branch_id)
    
    db.delete(report)
    db.commit()
    return {"status": "deleted", "message": "تم حذف التقرير بنجاح"}


# ========== SALES VISITS ENDPOINTS ==========

@app.post("/sales-visits", response_model=SalesVisitOut)
def create_sales_visit(
    payload: SalesVisitIn,
    report_id: int,
    db: Session = Depends(get_db),
    user: OperationAccount = Depends(get_current_user),
):
    """إضافة زيارة لتقرير مبيعات يومي"""
    require_sales_manager(user)
    report = db.query(DailySalesReport).filter(DailySalesReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="التقرير غير موجود")
    assert_branch_access(user, report.branch_id)
    assert_branch_access(user, payload.branch_id)
    
    visit = SalesVisit(
        daily_sales_report_id=report_id,
        **payload.dict()
    )
    db.add(visit)
    db.commit()
    db.refresh(visit)
    return visit


@app.get("/sales-visits/{report_id}", response_model=List[SalesVisitOut])
def get_sales_visits(
    report_id: int,
    db: Session = Depends(get_db),
    user: OperationAccount = Depends(get_current_user),
):
    """الحصول على زيارات تقرير مبيعات يومي"""
    report = db.query(DailySalesReport).filter(DailySalesReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="التقرير غير موجود")
    assert_branch_access(user, report.branch_id)
    
    visits = db.query(SalesVisit).filter(
        SalesVisit.daily_sales_report_id == report_id
    ).order_by(SalesVisit.visit_order).all()
    return visits


@app.patch("/sales-visits/{visit_id}", response_model=SalesVisitOut)
def update_sales_visit(
    visit_id: int,
    payload: SalesVisitUpdate,
    db: Session = Depends(get_db),
    user: OperationAccount = Depends(get_current_user),
):
    """تحديث زيارة"""
    require_sales_manager(user)
    visit = db.query(SalesVisit).filter(SalesVisit.id == visit_id).first()
    if not visit:
        raise HTTPException(status_code=404, detail="الزيارة غير موجودة")
    
    report = db.query(DailySalesReport).filter(DailySalesReport.id == visit.daily_sales_report_id).first()
    assert_branch_access(user, report.branch_id)
    
    if payload.branch_id:
        assert_branch_access(user, payload.branch_id)
    
    update_data = payload.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(visit, field, value)
    
    db.commit()
    db.refresh(visit)
    return visit


@app.delete("/sales-visits/{visit_id}")
def delete_sales_visit(
    visit_id: int,
    db: Session = Depends(get_db),
    user: OperationAccount = Depends(get_current_user),
):
    """حذف زيارة"""
    require_sales_manager(user)
    visit = db.query(SalesVisit).filter(SalesVisit.id == visit_id).first()
    if not visit:
        raise HTTPException(status_code=404, detail="الزيارة غير موجودة")
    
    report = db.query(DailySalesReport).filter(DailySalesReport.id == visit.daily_sales_report_id).first()
    assert_branch_access(user, report.branch_id)
    
    db.delete(visit)
    db.commit()
    return {"status": "deleted", "message": "تم حذف الزيارة بنجاح"}



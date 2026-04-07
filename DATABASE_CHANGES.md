# Database Schema Changes Tracking

This file tracks all modifications made to the database schema to ensure they can be applied to the production database later.

## [2026-01-05] Add Course Reordering

### Description
Added a `sort_order` column to the `courses` table to allow custom ordering of courses in the UI.

### SQL Migration
Run the following SQL on your production database:

```sql
ALTER TABLE `courses` ADD `sort_order` INT NOT NULL DEFAULT 0 AFTER `is_active`;
```

### Laravel Migration (Alternative)
If you prefer using artisan:
```bash
php artisan migrate --path=database/migrations/2026_01_05_000000_add_sort_order_to_courses_table.php
```

---

---

## [2026-01-05] Separate Net Profit Expenses

### Description
Created a separate table `net_profit_expenses` to isolate operational expenses from other reports.

### SQL Migration
```sql
CREATE TABLE `net_profit_expenses` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `branch_id` BIGINT UNSIGNED NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `amount` DECIMAL(12, 2) NOT NULL,
    `expense_date` TIMESTAMP NULL,
    `created_at` TIMESTAMP NULL,
    `updated_at` TIMESTAMP NULL,
    FOREIGN KEY (`branch_id`) REFERENCES `branches`(`id`) ON DELETE CASCADE
);
```

### Laravel Migration
```bash
php artisan migrate --path=database/migrations/2026_01_05_000001_create_net_profit_expenses_table.php
```

---

## [2026-01-05] Add Tax Percentage to Payment Methods

### Description
Added a `tax_percentage` column to the `payment_methods` table to allow specific tax calculations (e.g., VAT) per payment method.

### SQL Migration
```sql
ALTER TABLE `payment_methods` ADD `tax_percentage` DECIMAL(10, 4) NOT NULL DEFAULT 0.05 AFTER `discount_percentage`;
```

### Laravel Migration
```bash
php artisan migrate --path=database/migrations/2026_01_05_000002_add_tax_percentage_to_payment_methods.php
```

## [2026-01-15] Shared Contract Deletion Confirmation

### Description
Added a `deletion_requested_by_branch_id` column to the `contracts` table to support a two-step deletion process for shared contracts, requiring confirmation from both involved branches.

### SQL Migration
```sql
ALTER TABLE `contracts` ADD `deletion_requested_by_branch_id` BIGINT UNSIGNED NULL AFTER `notes`;
ALTER TABLE `contracts` ADD CONSTRAINT `contracts_deletion_requested_by_branch_id_foreign` FOREIGN KEY (`deletion_requested_by_branch_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL;
```

### Laravel Migration
```bash
php artisan migrate --path=database/migrations/2026_01_15_000000_add_deletion_request_to_contracts.php
```

---

## [2026-01-18] Add Cascade to Parent Contract ID

### Description
Modified the `parent_contract_id` foreign key in the `contracts` table to support `ON DELETE CASCADE`. This prevents integrity constraint violations when a parent contract is deleted, ensuring all associated "old payment" records are also removed.

### Laravel Migration
```bash
php artisan migrate --path=database/migrations/2026_01_18_100000_add_cascade_to_parent_contract_id.php
```

## [2026_01_24] Add Month and Year to Reports Expenses

### Description
Added `month` and `year` columns to the `expenses` table to allow persistent storage and filtering of additional expenses in training reports.

### SQL Migration
```sql
ALTER TABLE `expenses` ADD `month` INT NULL AFTER `branch_id`;
ALTER TABLE `expenses` ADD `year` INT NULL AFTER `month`;
```

### Laravel Migration
```bash
php artisan migrate --path=database/migrations/2026_01_24_190000_add_month_year_to_expenses_table.php
```

---

## [2026-03-26] Add Expense Categories

### Description
Created `expense_categories` table to store predefined expense types for the Net Profit page.

### SQL Migration
```sql
CREATE TABLE `expense_categories` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL UNIQUE,
    `is_active` TINYINT(1) NOT NULL DEFAULT 1,
    `created_at` TIMESTAMP NULL,
    `updated_at` TIMESTAMP NULL
);
```

### Laravel Migration
```bash
php artisan migrate --path=database/migrations/2026_03_26_000000_create_expense_categories_table.php
```

---

## [2026-03-28] Add Employee Management System

### Description
Created `employees` table to store employee names, employment numbers, and salary information with branch assignment.

### SQL Migration
**Copy and paste this into your SQL console:**
```sql
DROP TABLE IF EXISTS `employees`;

CREATE TABLE `employees` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `employment_number` VARCHAR(255) NOT NULL UNIQUE,
    `name` VARCHAR(255) NOT NULL,
    `branch_id` INT(11) NOT NULL, -- EXACT MATCH with branches.id on server
    `salary` DECIMAL(10, 2) NOT NULL,
    `notes` TEXT NULL,
    `is_active` TINYINT(1) NOT NULL DEFAULT 1,
    `created_at` TIMESTAMP NULL,
    `updated_at` TIMESTAMP NULL,
    INDEX `employees_branch_id_index` (`branch_id`),
    CONSTRAINT `employees_branch_id_foreign` 
        FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Laravel Migration
```bash
php artisan migrate --path=database/migrations/2026_03_28_200000_create_employees_table.php
```

---

## [2026-03-28] Add Salaries Management System

### Description
Implemented a comprehensive salary management system including tracking of base salary, working days, entitled salary, additions, and deductions.

### SQL Migration
**Copy and paste this into your SQL console:**
```sql
CREATE TABLE `salaries` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `employee_id` BIGINT UNSIGNED NOT NULL,
    `branch_id` INT(11) NOT NULL,
    `month` INT NOT NULL,
    `year` INT NOT NULL,
    `base_salary` DECIMAL(12, 2) NOT NULL,
    `working_days` INT NOT NULL,
    `entitled_salary` DECIMAL(12, 2) NOT NULL,
    `net_salary` DECIMAL(12, 2) NOT NULL,
    `notes` TEXT NULL,
    `is_processed` TINYINT(1) NOT NULL DEFAULT 0,
    `created_at` TIMESTAMP NULL,
    `updated_at` TIMESTAMP NULL,
    FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`branch_id`) REFERENCES `branches`(`id`) ON DELETE CASCADE,
    UNIQUE KEY `employee_month_year_unique` (`employee_id`, `month`, `year`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `salary_items` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `salary_id` BIGINT UNSIGNED NOT NULL,
    `type` ENUM('addition', 'deduction') NOT NULL,
    `amount` DECIMAL(12, 2) NOT NULL,
    `reason` VARCHAR(255) NOT NULL,
    `is_automatic` TINYINT(1) NOT NULL DEFAULT 0,
    `created_at` TIMESTAMP NULL,
    `updated_at` TIMESTAMP NULL,
    FOREIGN KEY (`salary_id`) REFERENCES `salaries`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Laravel Migration
```bash
php artisan migrate --path=database/migrations/2026_03_28_300000_create_salaries_tables.php
```

---

## [2026-03-29] Add Days Metadata to Salary Items

### Description
Added a `days` column to the `salary_items` table to support persistent storage and retrieval of specific day-counts for automatic additions.

### SQL Migration
```sql
ALTER TABLE `salary_items` ADD `days` VARCHAR(255) NULL AFTER `reason`;
```

### Laravel Migration
```bash
php artisan migrate --path=database/migrations/2026_03_29_005600_add_days_to_salary_items_table.php
```

---

## [2026-03-29] Enhanced Payroll Data Persistence

### Description
Introduced historical metadata snapshot columns (`employee_name`, `employment_number`) to the `salaries` table and ensured `SoftDeletes` support for the `employees` table. Also modified the foreign key constraint to prevent cascading deletion of financial records.

> [!NOTE]
> The `deleted_at` column for `employees` may already exist in some environments. If so, skip the first SQL step below.

### SQL Migration
```sql
-- 1. Add SoftDeletes to Employees (SKIP if already exists: #1060 Duplicate column)
-- ALTER TABLE `employees` ADD `deleted_at` TIMESTAMP NULL AFTER `is_active`;

-- 2. Add Persistence Snapshots to Salaries
ALTER TABLE `salaries` ADD `employee_name` VARCHAR(255) NULL AFTER `employee_id`;
ALTER TABLE `salaries` ADD `employment_number` VARCHAR(255) NULL AFTER `employee_name`;

-- 3. Modify Foreign Key (Remove Cascade)
-- IMPORTANT: If `salaries_employee_id_foreign` was not found, MariaDB likely named it `salaries_ibfk_1`.
-- You can find the exact name by running: SHOW CREATE TABLE `salaries`;

-- Try dropping the most likely engine-generated name:
ALTER TABLE `salaries` DROP FOREIGN KEY `salaries_ibfk_1`; 

-- Then add the new constraint with a permanent, searchable name:
ALTER TABLE `salaries` ADD CONSTRAINT `salaries_employee_id_foreign` 
    FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`);
```

### Laravel Migration
```bash
php artisan migrate --path=database/migrations/2026_03_29_014000_add_soft_deletes_and_metadata_to_salaries_and_employees_tables.php
```

---

## [2026-03-29] Add HR Manager Role

### Description
Added a specialized `is_hr_manager` column to the `operation_accounts` table to support a restricted-access role that can only manage salaries.

### SQL Migration
```sql
ALTER TABLE `operation_accounts` ADD `is_hr_manager` TINYINT(1) NOT NULL DEFAULT 0 AFTER `is_backdoor`;
```

### Laravel Migration
```bash
php artisan migrate --path=database/migrations/2026_03_29_023000_add_is_hr_manager_to_operation_accounts_table.php
```

---

## [2026-04-07] Add Certification Management System

### Description
Created `certificates` table to manage student certificate requests and PDF uploads.

### SQL Migration
```sql
CREATE TABLE `certificates` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `student_name_ar` VARCHAR(255) NOT NULL,
    `student_name_en` VARCHAR(255) NOT NULL,
    `id_passport_number` VARCHAR(255) NOT NULL,
    `certificate_name` VARCHAR(255) NOT NULL,
    `course_type` VARCHAR(255) NOT NULL,
    `duration` VARCHAR(255) NOT NULL,
    `certificate_type` ENUM('local', 'international', 'knowledge_authority') NOT NULL,
    `status` ENUM('requested', 'uploaded') NOT NULL DEFAULT 'requested',
    `file_path` VARCHAR(255) NULL,
    `branch_id` INT(11) NOT NULL,
    `operation_account_id` INT(11) NOT NULL,
    `month` INT NOT NULL,
    `year` INT NOT NULL,
    `created_at` TIMESTAMP NULL,
    `updated_at` TIMESTAMP NULL,
    FOREIGN KEY (`branch_id`) REFERENCES `branches`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`operation_account_id`) REFERENCES `operation_accounts`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Laravel Migration
```bash
php artisan migrate --path=database/migrations/2026_04_07_131100_create_certificates_table.php
```

---

## [2026-04-07] Add Phone and Contract Fields to Certificates

### Description
Added `phone_number` and `contract_number` columns to the `certificates` table and updated the `status` ENUM to include `delivered`.

### SQL Migration
```sql
ALTER TABLE `certificates` ADD `phone_number` VARCHAR(255) NULL AFTER `student_name_en`;
ALTER TABLE `certificates` ADD `contract_number` VARCHAR(255) NULL AFTER `phone_number`;
ALTER TABLE `certificates` MODIFY COLUMN `status` ENUM('requested', 'uploaded', 'delivered') NOT NULL DEFAULT 'requested';
```

### Laravel Migration
```bash
php artisan migrate --path=database/migrations/2026_04_07_153000_add_phone_and_contract_to_certificates_table.php
```

---

*Keep this file updated for any future schema changes.*

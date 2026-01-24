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

*Keep this file updated for any future schema changes.*

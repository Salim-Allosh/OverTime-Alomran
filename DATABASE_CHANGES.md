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

*Keep this file updated for any future schema changes.*

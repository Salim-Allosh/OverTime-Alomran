import re

with open('DailySalesReportsPage.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# The old summary block (lines 1746-1755)
old = """      // Summary
      const salesContracts = group.contracts.filter(c => c.contract_type !== 'old_payment' && c.contract_type !== 'payment' && c.contract_type !== 'cancellation');
      const oldPaymentContracts = group.contracts.filter(c => c.contract_type === 'old_payment' || c.contract_type === 'payment');
      const totalContracts = salesContracts.length;
      const totalAmount = salesContracts.reduce((sum, c) => sum + parseFloat(c.total_amount || 0), 0);
      const totalPaid = salesContracts.reduce((sum, c) => sum + parseFloat(c.payment_amount || 0), 0);
      const totalRemaining = group.contracts.reduce((sum, c) => sum + parseFloat(c.remaining_amount || 0), 0);
      const totalNet = salesContracts.reduce((sum, c) => sum + parseFloat(c.net_amount || 0), 0);
      const totalFee = totalPaid - totalNet; // النسبة
      const totalOtherCollections = oldPaymentContracts.reduce((sum, c) => sum + parseFloat(c.payment_amount || 0), 0); // تحصيلات فترات أخرى"""

new = """      // Summary - Uses same logic as Statistics page backend:
      // - salesContracts: new/shared contracts (not old_payment, payment, cancellation)
      // - totalPaid / totalNet: SUM of contract_payments (direct payments on each contract)
      // - totalOtherCollections: direct payments on old_payment-type contracts
      // This matches StatisticsController which sums from ContractPayment table directly.
      const salesContracts = group.contracts.filter(c => c.contract_type !== 'old_payment' && c.contract_type !== 'payment' && c.contract_type !== 'cancellation');
      const oldPaymentContracts = group.contracts.filter(c => c.contract_type === 'old_payment' || c.contract_type === 'payment');
      const totalContracts = salesContracts.length;
      const totalAmount = salesContracts.reduce((sum, c) => sum + parseFloat(c.total_amount || 0), 0);

      // Use direct payments array (like Statistics backend uses ContractPayment table)
      // This avoids double-counting since contract.payment_amount includes child contract payments
      const getDirectPayments = (contracts) => contracts.reduce((sum, c) => {
        if (c.payments && c.payments.length > 0) {
          return sum + c.payments.reduce((s, p) => s + parseFloat(p.payment_amount || 0), 0);
        }
        return sum + parseFloat(c.payment_amount || 0);
      }, 0);
      const getDirectNet = (contracts) => contracts.reduce((sum, c) => {
        if (c.payments && c.payments.length > 0) {
          return sum + c.payments.reduce((s, p) => s + parseFloat(p.net_amount || 0), 0);
        }
        return sum + parseFloat(c.net_amount || 0);
      }, 0);

      const totalPaid = getDirectPayments(salesContracts);
      const totalNet = getDirectNet(salesContracts);
      const totalRemaining = salesContracts.reduce((sum, c) => sum + parseFloat(c.remaining_amount || 0), 0);
      const totalFee = totalPaid - totalNet; // النسبة
      const totalOtherCollections = getDirectPayments(oldPaymentContracts); // تحصيلات فترات أخرى"""

if old in content:
    content = content.replace(old, new, 1)
    with open('DailySalesReportsPage.jsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print("SUCCESS: Summary calculations updated to match Statistics page logic")
else:
    print("NOT FOUND - searching for fragments...")
    if "const totalPaid = salesContracts.reduce" in content:
        print("Found old totalPaid line")
    if "const totalOtherCollections = oldPaymentContracts" in content:
        print("Found old totalOtherCollections line")

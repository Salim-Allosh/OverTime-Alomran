<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Course;
use App\Models\PaymentMethod;
use App\Models\Expense;
use App\Models\OperationAccount;
use App\Models\NetProfitExpense;
use Illuminate\Support\Facades\Hash;

class LookupController extends Controller
{
    public function courses()
    {
        return Course::orderBy('sort_order', 'asc')->get();
    }
    
    public function createCourse(Request $request) 
    {
        $validated = $request->validate([
            'name' => 'required|unique:courses,name',
            'type' => 'nullable|string'
        ]);
        
        // Set sort_order to the max + 1
        $maxOrder = Course::max('sort_order') ?? 0;
        $validated['sort_order'] = $maxOrder + 1;
        
        return Course::create($validated);
    }

    public function reorderCourses(Request $request)
    {
        $validated = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:courses,id'
        ]);

        foreach ($validated['ids'] as $index => $id) {
            Course::where('id', $id)->update(['sort_order' => $index + 1]);
        }

        return response()->json(['status' => 'success']);
    }
    
    public function updateCourse(Request $request, $id)
    {
        $course = Course::findOrFail($id);
        
        $validated = $request->validate([
            'name' => 'required|unique:courses,name,' . $id,
            'type' => 'nullable|string'
        ]);
        
        $course->update($validated);
        return $course;
    }
    
    public function deleteCourse($id)
    {
        Course::destroy($id);
        return response()->noContent();
    }

    public function paymentMethods()
    {
        return PaymentMethod::all();
    }

    public function createPaymentMethod(Request $request) 
    {
        $validated = $request->validate([
            'name' => 'required|unique:payment_methods,name',
            'discount_percentage' => 'nullable|numeric|min:0|max:1',
            'tax_percentage' => 'nullable|numeric|min:0|max:1',
            'is_active' => 'boolean'
        ]);
        
        return PaymentMethod::create($validated);
    }
    
    public function updatePaymentMethod(Request $request, $id)
    {
        $method = PaymentMethod::findOrFail($id);
        
        $validated = $request->validate([
            'name' => 'required|unique:payment_methods,name,' . $id,
            'discount_percentage' => 'nullable|numeric|min:0|max:1',
            'tax_percentage' => 'nullable|numeric|min:0|max:1',
            'is_active' => 'boolean'
        ]);
        
        $method->update($validated);
        return $method;
    }
    
    public function deletePaymentMethod($id)
    {
        PaymentMethod::destroy($id);
        return response()->noContent();
    }

    public function expenses(Request $request)
    {
        $query = Expense::query();
        if($request->branch_id) $query->where('branch_id', $request->branch_id);
        return $query->orderBy('created_at', 'desc')->get();
    }

    public function createExpense(Request $request)
    {
        return Expense::create($request->all());
    }

    public function updateExpense(Request $request, $id)
    {
        $expense = Expense::findOrFail($id);
        $expense->update($request->all());
        return $expense;
    }

    public function deleteExpense($id)
    {
        Expense::destroy($id);
        return response()->noContent();
    }

    // Account Management
    public function accountsIndex(Request $request)
    {
        $user = $request->user();
        $query = OperationAccount::query();
        
        if (!$user->is_super_admin && !$user->is_backdoor) {
            $query->where('branch_id', $user->branch_id);
        }
        
        return $query->with('branch')->get();
    }
    
    public function createAccount(Request $request)
    {
        $data = $request->all();
        $data['password_hash'] = Hash::make($data['password']);
        return OperationAccount::create($data);
    }
    
    public function deleteAccount(Request $request, $id)
    {
        $user = $request->user();
        if (!$user->is_super_admin && !$user->is_backdoor) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        if ($user->id == $id) {
            return response()->json(['error' => 'Cannot delete your own account'], 400);
        }

        try {
            $account = OperationAccount::findOrFail($id);
            $account->is_active = false;
            $account->save();
            $account->delete();
            return response()->json(['status' => 'deleted']);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Internal Server Error'], 500);
        }
    }

    public function updateAccount(Request $request, $id)
    {
        $account = OperationAccount::findOrFail($id);
        $data = $request->all();
        
        if (!empty($data['password'])) {
            $data['password_hash'] = Hash::make($data['password']);
        } else {
            unset($data['password']); // Don't overwrite if empty
            unset($data['password_hash']);
        }
        
        $account->update($data);
        return $account;
    }

    // Net Profit Expenses
    public function netProfitExpensesIndex(Request $request)
    {
        $query = NetProfitExpense::query();
        if($request->branch_id) $query->where('branch_id', $request->branch_id);
        if($request->year) $query->whereYear('expense_date', $request->year);
        if($request->month) $query->whereMonth('expense_date', $request->month);
        
        return $query->orderBy('expense_date', 'desc')->get();
    }

    public function createNetProfitExpense(Request $request)
    {
        $validated = $request->validate([
            'branch_id' => 'required|exists:branches,id',
            'title' => 'required|string',
            'amount' => 'required|numeric',
            'expense_date' => 'required|date'
        ]);

        return NetProfitExpense::create($validated);
    }

    public function updateNetProfitExpense(Request $request, $id)
    {
        $expense = NetProfitExpense::findOrFail($id);
        $validated = $request->validate([
            'title' => 'string',
            'amount' => 'numeric',
            'expense_date' => 'date'
        ]);

        $expense->update($validated);
        return $expense;
    }

    public function deleteNetProfitExpense($id)
    {
        NetProfitExpense::destroy($id);
        return response()->noContent();
    }
}

<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\OperationAccount;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'username' => 'required',
            'password' => 'required',
        ]);

        $user = OperationAccount::where('username', $request->username)->first();

        // Note: Python used bcrypt ($2b$). PHP uses $2y$ by default.
        // If password verification fails for old accounts, they need their password reset.
        if (! $user || ! Hash::check($request->password, $user->password_hash)) {
            throw ValidationException::withMessages([
                'username' => ['Incorrect username or password.'],
            ]);
        }

        if (! $user->is_active) {
            throw ValidationException::withMessages([
                'username' => ['Account is disabled.'],
            ]);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user' => $user
        ]);
    }

    public function me(Request $request)
    {
        return $request->user();
    }
}

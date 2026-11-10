<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateOrderStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === 'admin';
    }

    public function rules(): array
    {
        return [
            'status' => [
                'required',
                'string',
                Rule::in([
                    'pending',
                    'paid',
                    'shipped',
                    'delivered',
                    'cancelled',
                ]),
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'status.required' => 'O status do pedido é obrigatório.',
            'status.in' => 'O status informado não é válido.',
        ];
    }
}
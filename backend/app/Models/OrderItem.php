<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrderItem extends Model
{
    protected $fillable = [
        'order_id',
        'product_id',
        'product_name',
        'product_slug',
        'unit_price',
        'quantity',
    ];

    protected function casts(): array
    {
        return [
            'unit_price' => 'decimal:2',
            'quantity' => 'integer',
        ];
    }

    /**
     * Retorna o pedido ao qual o item pertence.
     */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    /**
     * Retorna o produto original, caso ainda exista.
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
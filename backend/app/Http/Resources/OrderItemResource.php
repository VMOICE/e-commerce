<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        [$whole, $fraction] = array_pad(
            explode('.', (string) $this->unit_price, 2),
            2,
            '00'
        );

        $unitPriceCents = ((int) $whole * 100)
            + (int) str_pad(substr($fraction, 0, 2), 2, '0');

        $subtotalCents = $unitPriceCents * $this->quantity;

        return [
            'id' => $this->id,
            'product_id' => $this->product_id,
            'product_name' => $this->product_name,
            'product_slug' => $this->product_slug,
            'unit_price' => $this->unit_price,
            'quantity' => $this->quantity,
            'subtotal' => intdiv($subtotalCents, 100)
                . '.'
                . str_pad((string) ($subtotalCents % 100), 2, '0', STR_PAD_LEFT),
        ];
    }
}
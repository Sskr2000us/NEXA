'use client'

import { useState } from 'react'
import { ShoppingCart, Star, DollarSign, CheckCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

interface Product {
  id: string
  name: string
  brand: string
  price: number
  rating: number
  compatible: boolean
  image_url?: string
}

export default function MarketplacePage() {
  const [products] = useState<Product[]>([
    {
      id: '1',
      name: 'Smart LED Bulb (4-Pack)',
      brand: 'Philips Hue',
      price: 59.99,
      rating: 4.5,
      compatible: true
    },
    {
      id: '2',
      name: 'Smart Thermostat',
      brand: 'Nest',
      price: 249.99,
      rating: 4.8,
      compatible: true
    },
    {
      id: '3',
      name: 'Smart Lock Pro',
      brand: 'August',
      price: 199.99,
      rating: 4.6,
      compatible: true
    }
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Device Marketplace</h1>
        <p className="text-gray-600 mt-1">Curated smart home devices compatible with NEXA</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <Card key={product.id}>
            <CardContent className="pt-6">
              <div className="aspect-square bg-gray-100 rounded-lg mb-4 flex items-center justify-center">
                <ShoppingCart className="w-16 h-16 text-gray-400" />
              </div>
              <h3 className="font-semibold text-lg mb-1">{product.name}</h3>
              <p className="text-sm text-gray-600 mb-2">{product.brand}</p>
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center">
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <span className="text-sm ml-1">{product.rating}</span>
                </div>
                {product.compatible && (
                  <span className="flex items-center text-xs text-green-600">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Compatible
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">${product.price}</span>
                <Button size="sm">
                  <ShoppingCart className="w-4 h-4 mr-1" />
                  Buy Now
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

import { FormEvent, useState } from 'react'
import type { OwnerProperty, PropertyStatus } from '@/types/owner'

interface NewPropertyFormProps {
    // El padre decide que hacer cuando se crea un inmueble.
    // Aqui solo emitimos los datos del formulario.
    onCreate: (input: Omit<OwnerProperty, 'id' | 'createdAt'>) => void
}

export default function NewPropertyForm({ onCreate }: NewPropertyFormProps) {
    // Estado local de cada campo del formulario (controlado por React)
    const [title, setTitle] = useState('')
    const [address, setAddress] = useState('')
    const [area, setArea] = useState('')
    const [availableRooms, setAvailableRooms] = useState('1')
    const [rent, setRent] = useState('350')
    const [status, setStatus] = useState<PropertyStatus>('open')
    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault() // evita recargar la pagina al enviar el form
        // Validacion minima en cliente (frontend)
        if (!title.trim() || !address.trim() || !area.trim()) return
        // Enviamos los datos al padre.
        // OJO: conversion de strings a number para campos numericos.
        onCreate({
            title: title.trim(),
            address: address.trim(),
            area: area.trim(),
            availableRooms: Number.parseInt(availableRooms, 10) || 1,
            rent: Number.parseInt(rent, 10) || 0,
            status,
        })
        // Reset del formulario para seguir creando inmuebles rapidamente
        setTitle('')
        setAddress('')
        setArea('')
        setAvailableRooms('1')
        setRent('350')
        setStatus('open')
    }
    return (
        <form
            onSubmit={handleSubmit}
            className="grid gap-3 rounded-2xl border border-[var(--rm-border)] bg-white p-4 sm:grid-cols-2"
        >
            {/* Titulo */}
            <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Titulo del inmueble"
                className="rounded-xl border border-emerald-900/15 px-3 py-2"
                required
            />
            {/* Direccion */}
            <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Direccion"
                className="rounded-xl border border-emerald-900/15 px-3 py-2"
                required
            />
            {/* Zona */}
            <input
                value={area}
                onChange={(e) => setArea(e.target.value)}
                placeholder="Zona"
                className="rounded-xl border border-emerald-900/15 px-3 py-2"
                required
            />
            {/* Habitaciones disponibles */}
            <input
                type="number"
                min={1}
                value={availableRooms}
                onChange={(e) => setAvailableRooms(e.target.value)}
                placeholder="Habitaciones libres"
                className="rounded-xl border border-emerald-900/15 px-3 py-2"
            />
            {/* Precio mensual */}
            <input
                type="number"
                min={0}
                value={rent}
                onChange={(e) => setRent(e.target.value)}
                placeholder="Precio mensual"
                className="rounded-xl border border-emerald-900/15 px-3 py-2"
            />
            {/* Estado del inmueble */}
            <select
                value={status}
                onChange={(e) => setStatus(e.target.value as PropertyStatus)}
                className="rounded-xl border border-emerald-900/15 px-3 py-2"
            >
                <option value="open">Abierto</option>
                <option value="closed">Cerrado</option>
                <option value="full">Completo</option>
            </select>
            {/* Boton submit */}
            <button
                type="submit"
                className="sm:col-span-2 rounded-xl bg-[var(--rm-primary)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--rm-primary-strong)]"
            >
                Anadir inmueble
            </button>
        </form>
    )
}
'use client';

import React, { useState } from 'react';
import { Plus, Edit3, Trash2, Check, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/app/lib/utils';
import {
  Category, SEED_CATEGORIES,
  InlineInput, Toggle,
} from './shared';

export default function CategoriesTab() {
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>(SEED_CATEGORIES);
  const [adding, setAdding]         = useState(false);
  const [editId, setEditId]         = useState<string | null>(null);
  const [draft, setDraft]           = useState({ name: '', icon: '', description: '' });

  const resetDraft = () => setDraft({ name: '', icon: '', description: '' });

  const handleSave = () => {
    if (!draft.name.trim()) return;
    if (editId) {
      setCategories((p) => p.map((c) => c.id === editId ? { ...c, ...draft } : c));
      toast({ title: 'Category updated' });
      setEditId(null);
    } else {
      setCategories((p) => [...p, {
        id: `cat${Date.now()}`, ...draft, serviceCount: 0, active: true,
      }]);
      toast({ title: 'Category added ✓' });
      setAdding(false);
    }
    resetDraft();
  };

  const startEdit = (cat: Category) => {
    setDraft({ name: cat.name, icon: cat.icon, description: cat.description });
    setEditId(cat.id);
    setAdding(false);
  };

  const handleDelete = (id: string) => {
    setCategories((p) => p.filter((c) => c.id !== id));
    toast({ title: 'Category removed' });
  };

  return (
    <div className="space-y-4">
      {/* Add / Edit form */}
      {(adding || editId) && (
        <Card className="border border-[#C84B31]/20 shadow-none bg-[#FFF0EC]">
          <CardContent className="p-4 sm:p-5">
            <p className="text-[12px] font-bold text-[#C84B31] mb-4">
              {editId ? '✏️ Edit Category' : '+ New Category'}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
              <InlineInput label="Icon (emoji)" value={draft.icon} onChange={(v) => setDraft((p) => ({ ...p, icon: v }))} placeholder="e.g. ✂️" />
              <InlineInput label="Category Name" value={draft.name} onChange={(v) => setDraft((p) => ({ ...p, name: v }))} placeholder="e.g. Hair Care" className="sm:col-span-2" />
            </div>
            <InlineInput label="Description" value={draft.description} onChange={(v) => setDraft((p) => ({ ...p, description: v }))} placeholder="Short description" className="mb-4" />
            <div className="flex gap-2">
              <button onClick={handleSave} className="flex items-center gap-1.5 h-9 px-4 bg-[#C84B31] hover:bg-[#B04028] text-white text-[12px] font-semibold rounded-xl transition-colors">
                <Check className="w-3.5 h-3.5" /> {editId ? 'Update' : 'Add Category'}
              </button>
              <button onClick={() => { setAdding(false); setEditId(null); resetDraft(); }} className="flex items-center gap-1.5 h-9 px-4 bg-white border border-[#EBEBEB] text-[#6B7280] text-[12px] font-semibold rounded-xl hover:bg-[#F5F4F2] transition-colors">
                <X className="w-3.5 h-3.5" /> Cancel
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {!adding && !editId && (
          <button
            onClick={() => { setAdding(true); setEditId(null); }}
            className="flex flex-col items-center justify-center gap-2 py-8 border-2 border-dashed border-[#FDDDD5] bg-[#FFF0EC] rounded-2xl hover:bg-[#FFE8E0] transition-colors group"
          >
            <Plus className="w-6 h-6 text-[#C84B31] group-hover:scale-110 transition-transform" />
            <span className="text-[12px] font-semibold text-[#C84B31]">Add Category</span>
          </button>
        )}
        {categories.map((cat) => (
          <Card key={cat.id} className={cn('border shadow-none', cat.active ? 'border-[#EBEBEB] bg-white' : 'border-[#EBEBEB] bg-[#F5F4F2] opacity-70')}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="w-12 h-12 rounded-2xl bg-[#FFF0EC] border border-[#FDDDD5] flex items-center justify-center text-2xl shrink-0">
                  {cat.icon}
                </div>
                <Toggle checked={cat.active} onChange={(v) => setCategories((p) => p.map((c) => c.id === cat.id ? { ...c, active: v } : c))} />
              </div>
              <h3 className="font-bold text-[14px] text-[#1A1A1A] mb-0.5">{cat.name}</h3>
              <p className="text-[11px] text-[#9CA3AF] mb-3 leading-snug">{cat.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-[#6B7280] bg-[#F5F4F2] border border-[#EBEBEB] px-2 py-0.5 rounded-full">
                  {cat.serviceCount} services
                </span>
                <div className="flex items-center gap-1">
                  <button onClick={() => startEdit(cat)} className="w-7 h-7 rounded-lg bg-[#F5F4F2] border border-[#EBEBEB] flex items-center justify-center text-[#6B7280] hover:bg-[#FFF0EC] hover:text-[#C84B31] transition-colors">
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDelete(cat.id)} className="w-7 h-7 rounded-lg bg-[#F5F4F2] border border-[#EBEBEB] flex items-center justify-center text-[#6B7280] hover:bg-red-50 hover:text-red-500 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
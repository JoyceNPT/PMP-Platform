import { useState } from 'react';
import { toast } from 'react-hot-toast';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import {
  TrendingUp, TrendingDown, Wallet, PiggyBank,
  Plus, Trash2, Edit, Bot, ChevronLeft, ChevronRight, Loader2
} from 'lucide-react';
import { useFinanceSummary, useSavingGoals, useAiPrediction, useCategories, useTransactions } from '@/features/finance/components/useFinance';
import { financeService } from '@/services/finance/financeService';
import { ConfirmModal } from '@/components/shared/ConfirmModal';

// ─── Format helpers ───────────────────────────────────────────────────────────
const fmtVnd = (v: number) =>
  v >= 1_000_000
    ? `${(v / 1_000_000).toFixed(1)}M`
    : v >= 1_000
    ? `${(v / 1_000).toFixed(0)}K`
    : `${v}`;

const EXPENSE_COLORS = [
  '#8b5cf6', '#3b82f6', '#f59e0b', '#10b981',
  '#ef4444', '#ec4899', '#06b6d4', '#84cc16',
];

// ─── Main Page ────────────────────────────────────────────────────────────────
export function FinancePage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear]   = useState(now.getFullYear());

  const { summary, loading: loadSum, refresh: refreshSum } = useFinanceSummary(year, month);
  const { goals, loading: loadGoals, refresh: refreshGoals } = useSavingGoals();
  const { prediction, loading: loadPred } = useAiPrediction();
  const { categories, refresh: refreshCats } = useCategories();

  // Reset and Category modals
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showDelGoal, setShowDelGoal] = useState(false);
  const [delGoalId, setDelGoalId]     = useState<string | null>(null);
  const [showDelCat, setShowDelCat]   = useState(false);
  const [delCatId, setDelCatId]       = useState<string | null>(null);
  const [showDelTx, setShowDelTx]     = useState(false);
  const [delTxId, setDelTxId]         = useState<string | null>(null);

  // Quick-add transaction state
  const [showAdd, setShowAdd]       = useState(false);
  const [txType, setTxType]         = useState(1); // 0=income, 1=expense
  const [txAmount, setTxAmount]     = useState('');
  const [txNote, setTxNote]         = useState('');
  const [txDate, setTxDate]         = useState(now.toISOString().slice(0, 10));
  const [txCatId, setTxCatId]       = useState('');
  const [txSubmitting, setTxSubmitting] = useState(false);
  const [editingTxId, setEditingTxId] = useState<string | null>(null);

  // Quick-add saving goal state
  const [showGoal, setShowGoal]     = useState(false);
  const [goalName, setGoalName]     = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [goalCurrent, setGoalCurrent] = useState('0');
  const [goalDate, setGoalDate]     = useState('');
  const [goalSubmitting, setGoalSubmitting] = useState(false);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  const handleAddTx = async () => {
    if (!txAmount || !txCatId) return;
    if (new Date(txDate) > new Date()) {
      toast.error('Không thể nhập giao dịch trong tương lai. Vui lòng chọn ngày hôm nay hoặc quá khứ.');
      return;
    }
    setTxSubmitting(true);
    try {
      const data = {
        categoryId: txCatId,
        type: txType,
        amount: parseFloat(txAmount),
        transactionDate: txDate,
        note: txNote || undefined,
      };
      if (editingTxId) {
        await financeService.updateTransaction(editingTxId, data);
      } else {
        await financeService.createTransaction(data);
      }
      setShowAdd(false);
      setEditingTxId(null);
      setTxAmount(''); setTxNote(''); setTxCatId('');
      refreshSum();
    } finally {
      setTxSubmitting(false);
    }
  };

  const handleAddGoal = async () => {
    if (!goalName || !goalTarget) return;
    setGoalSubmitting(true);
    try {
      const data = {
        name: goalName,
        targetAmount: parseFloat(goalTarget),
        currentAmount: parseFloat(goalCurrent) || 0,
        targetDate: goalDate || undefined,
      };
      if (editingGoalId) {
        const goal = goals.find(g => g.id === editingGoalId);
        await financeService.updateSavingGoal(editingGoalId, { ...data, status: goal?.status ?? 0 });
      } else {
        await financeService.createSavingGoal(data);
      }
      setShowGoal(false);
      setEditingGoalId(null);
      setGoalName(''); setGoalTarget(''); setGoalCurrent('0'); setGoalDate('');
      refreshGoals();
    } finally {
      setGoalSubmitting(false);
    }
  };

  const handleDeleteGoal = async (id: string) => {
    await financeService.deleteSavingGoal(id);
    toast.success('Đã xoá mục tiêu tiết kiệm');
    refreshGoals();
  };

  // Categories for quick-add dropdown
  const displayCats = categories.filter(c => c.type === txType);

  const handleResetData = async () => {
    setTxSubmitting(true);
    try {
      await financeService.resetAllData();
      setShowResetConfirm(false);
      refreshSum();
      refreshGoals();
      refreshCats();
      toast.success('Đã xoá toàn bộ dữ liệu tài chính thành công!');
    } finally {
      setTxSubmitting(false);
    }
  };

  if (loadSum) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6 relative">
      <div className="animate-fade-in-up space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Quản lý tài chính</h1>
          <p className="page-subtitle">Theo dõi thu chi, tiết kiệm và dự báo chi tiêu AI</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowResetConfirm(true)}
            className="flex items-center gap-2 h-9 px-4 rounded-xl border border-destructive/30 text-destructive text-sm font-medium hover:bg-destructive/10 transition">
            <Trash2 className="h-4 w-4" /> Reset dữ liệu
          </button>
          <button onClick={() => setShowCategoryModal(true)}
            className="flex items-center gap-2 h-9 px-4 rounded-xl bg-muted text-foreground text-sm font-medium hover:bg-muted/80 transition">
            Quản lý danh mục
          </button>
          <button onClick={() => {
            setEditingTxId(null);
            setTxAmount(''); setTxNote(''); setTxCatId('');
            setShowAdd(true);
          }}
            className="flex items-center gap-2 h-9 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition shadow shadow-primary/20">
            <Plus className="h-4 w-4" /> Thêm giao dịch
          </button>
        </div>
      </div>

      {/* ── Month navigator ── */}
      <div className="flex items-center gap-4">
        <button onClick={prevMonth} className="h-8 w-8 rounded-lg border flex items-center justify-center hover:bg-muted transition">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="font-semibold text-sm w-32 text-center">Tháng {month}/{year}</span>
        <button onClick={nextMonth} className="h-8 w-8 rounded-lg border flex items-center justify-center hover:bg-muted transition">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<TrendingUp className="h-5 w-5" />} label="Tổng thu" value={fmtVnd(summary?.totalIncome ?? 0)} sub="tháng này" color="from-emerald-400 to-teal-500" />
        <StatCard icon={<TrendingDown className="h-5 w-5" />} label="Tổng chi" value={fmtVnd(summary?.totalExpense ?? 0)} sub="tháng này" color="from-red-400 to-rose-500" />
        <StatCard icon={<Wallet className="h-5 w-5" />} label="Số dư" value={fmtVnd(summary?.balance ?? 0)} sub={`Tiết kiệm ${summary?.savingsRate ?? 0}%`} color="from-blue-400 to-violet-500" valueClass={(summary?.balance ?? 0) >= 0 ? 'text-emerald-500' : 'text-red-500'} />
        <StatCard icon={<PiggyBank className="h-5 w-5" />} label="Mục tiêu" value={`${goals.filter(g => g.status === 0).length}`} sub="đang tiết kiệm" color="from-orange-400 to-pink-500" />
      </div>

      {/* ── Charts row ── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Bar chart — 6 month trend */}
        <div className="bg-card rounded-2xl border p-5 space-y-3">
          <h3 className="font-semibold text-sm">Xu hướng 6 tháng</h3>
          {summary && summary.monthlyTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={summary.monthlyTrend} barSize={14} barGap={3}>
                <XAxis dataKey="label" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={v => fmtVnd(v)} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={45} />
                <Tooltip formatter={(v) => [`${Number(v ?? 0).toLocaleString()}đ`]} />
                <Bar dataKey="income"  fill="#10b981" radius={[4,4,0,0]} name="Thu" />
                <Bar dataKey="expense" fill="#ef4444" radius={[4,4,0,0]} name="Chi" />
                <Legend iconType="circle" iconSize={8} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart text="Chưa có dữ liệu giao dịch" />
          )}
        </div>

        {/* Pie chart — expense breakdown */}
        <div className="bg-card rounded-2xl border p-5 space-y-3">
          <h3 className="font-semibold text-sm">Cơ cấu chi tiêu</h3>
          {summary && summary.expenseBreakdown.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={summary.expenseBreakdown}
                  dataKey="amount"
                  nameKey="categoryName"
                  cx="45%" cy="50%"
                  outerRadius={75}
                  innerRadius={42}
                  paddingAngle={2}
                >
                  {summary.expenseBreakdown.map((entry, i) => (
                    <Cell key={i} fill={entry.colorHex ?? EXPENSE_COLORS[i % EXPENSE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => [`${Number(v ?? 0).toLocaleString()}đ`]} />
                <Legend iconType="circle" iconSize={8} formatter={(v) => <span className="text-xs">{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart text="Chưa có giao dịch chi tiêu" />
          )}
        </div>
      </div>

      {/* ── Transaction list ── */}
      <div className="bg-card rounded-2xl border p-5 space-y-3">
        <h3 className="font-semibold text-sm">Giao dịch gần đây</h3>
        <TransactionList 
          month={month} 
          year={year} 
          onRefresh={refreshSum} 
          onEdit={(tx) => {
             setEditingTxId(tx.id);
             setTxType(tx.type);
             setTxAmount(tx.amount.toString());
             setTxCatId(tx.categoryId);
             setTxNote(tx.note || '');
             setTxDate(tx.transactionDate.split('T')[0]);
             setShowAdd(true);
          }}
        />
      </div>

      {/* ── Saving Goals ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">Mục tiêu tiết kiệm</h3>
          <button onClick={() => {
             setEditingGoalId(null);
             setGoalName(''); setGoalTarget(''); setGoalCurrent('0'); setGoalDate('');
             setShowGoal(true);
          }}
            className="flex items-center gap-1.5 text-xs text-primary hover:underline">
            <Plus className="h-3.5 w-3.5" /> Thêm mục tiêu
          </button>
        </div>

        {loadGoals ? (
          <div className="h-16 flex items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : goals.length === 0 ? (
          <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground text-sm">
            <PiggyBank className="h-10 w-10 mx-auto mb-2 opacity-30" />
            <p>Chưa có mục tiêu tiết kiệm. Tạo ngay để theo dõi tiến độ!</p>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {goals.map(goal => (
              <GoalCard 
                key={goal.id} 
                goal={goal} 
                onDelete={(id) => { setDelGoalId(id); setShowDelGoal(true); }} 
                onRefresh={refreshGoals} 
                onEdit={(g) => {
                  setEditingGoalId(g.id);
                  setGoalName(g.name);
                  setGoalTarget(g.targetAmount.toString());
                  setGoalCurrent(g.currentAmount.toString());
                  setGoalDate(g.targetDate ? g.targetDate.split('T')[0] : '');
                  setShowGoal(true);
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── AI Prediction ── */}
      <div className="rounded-2xl border bg-gradient-to-br from-violet-500/10 to-purple-500/5 p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-sm">Dự báo chi tiêu AI</h3>
          {prediction?.confidence && (
            <span className="text-xs text-muted-foreground ml-auto">
              Độ tin cậy: {Math.round(prediction.confidence * 100)}%
            </span>
          )}
        </div>
        {loadPred ? (
          <div className="h-10 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Đang phân tích...
          </div>
        ) : prediction ? (
          <div className="space-y-2">
            <p className="text-2xl font-bold text-primary">{prediction.predictedAmount.toLocaleString()}đ</p>
            <p className="text-xs text-muted-foreground">Dự đoán chi tiêu {prediction.month}</p>
            <p className="text-sm leading-relaxed text-foreground/80">{prediction.insight}</p>
          </div>
        ) : null}
      </div>


      {/* ── Add Transaction Modal ── */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-2xl border bg-card shadow-xl p-6 space-y-4 animate-fade-in-up">
            <h3 className="font-bold text-lg">Thêm giao dịch</h3>

            {/* Type toggle */}
            <div className="flex gap-2">
              {[{ label: '💰 Thu nhập', v: 0 }, { label: '💸 Chi tiêu', v: 1 }].map(o => (
                <button key={o.v} onClick={() => setTxType(o.v)}
                  className={`flex-1 h-9 rounded-xl text-sm font-medium transition ${txType === o.v ? 'bg-primary text-primary-foreground' : 'border hover:bg-muted'}`}>
                  {o.label}
                </button>
              ))}
            </div>

            <input type="number" placeholder="Số tiền (VNĐ)" value={txAmount}
              onChange={e => setTxAmount(e.target.value)}
              className="flex h-10 w-full rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />

            <input type="date" value={txDate} onChange={e => setTxDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="flex h-10 w-full rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />

            {displayCats.length > 0 ? (
              <select value={txCatId} onChange={e => setTxCatId(e.target.value)}
                className="flex h-10 w-full rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                <option value="">-- Chọn danh mục --</option>
                {displayCats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            ) : (
              <div className="flex h-10 w-full rounded-xl border border-dashed items-center justify-center bg-muted/20">
                <button onClick={() => { setShowAdd(false); setShowCategoryModal(true); }} className="text-xs text-primary font-medium hover:underline">
                  Chưa có danh mục nào. Tạo ngay?
                </button>
              </div>
            )}

            <input placeholder="Ghi chú (tuỳ chọn)" value={txNote}
              onChange={e => setTxNote(e.target.value)}
              className="flex h-10 w-full rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />

            <div className="flex gap-3 justify-end pt-1">
              <button onClick={() => setShowAdd(false)} className="h-10 px-4 rounded-xl border text-sm hover:bg-muted transition">Huỷ</button>
              <button onClick={handleAddTx} disabled={txSubmitting || !txAmount}
                className="h-10 px-5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition flex items-center gap-2 disabled:opacity-60">
                {txSubmitting && <Loader2 className="h-4 w-4 animate-spin" />} Lưu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add Saving Goal Modal ── */}
      {showGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-2xl border bg-card shadow-xl p-6 space-y-4 animate-fade-in-up">
            <h3 className="font-bold text-lg">Tạo mục tiêu tiết kiệm</h3>
            <input placeholder="Tên mục tiêu (VD: Mua laptop)" value={goalName}
              onChange={e => setGoalName(e.target.value)} autoFocus
              className="flex h-10 w-full rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Số tiền mục tiêu</label>
                <input type="number" placeholder="VD: 15000000" value={goalTarget}
                  onChange={e => setGoalTarget(e.target.value)}
                  className="flex h-10 w-full rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Đã có sẵn</label>
                <input type="number" placeholder="0" value={goalCurrent}
                  onChange={e => setGoalCurrent(e.target.value)}
                  className="flex h-10 w-full rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Ngày mục tiêu (tuỳ chọn)</label>
              <input type="date" value={goalDate} onChange={e => setGoalDate(e.target.value)}
                className="flex h-10 w-full rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowGoal(false)} className="h-10 px-4 rounded-xl border text-sm hover:bg-muted transition">Huỷ</button>
              <button onClick={handleAddGoal} disabled={goalSubmitting || !goalName || !goalTarget}
                className="h-10 px-5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition flex items-center gap-2 disabled:opacity-60">
                {goalSubmitting && <Loader2 className="h-4 w-4 animate-spin" />} Tạo
              </button>
            </div>
          </div>
        </div>
      )}
      </div>

      {/* Categories Modal (Outside the animated div) */}
      {showCategoryModal && (
        <CategoryModal 
          onClose={() => setShowCategoryModal(false)} 
          categories={categories} 
          onRefresh={refreshCats} 
        />
      )}

      {/* Confirm Modals (Outside the animated div) */}
      <ConfirmModal
        isOpen={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        onConfirm={handleResetData}
        title="Xoá toàn bộ dữ liệu?"
        description="Toàn bộ giao dịch, mục tiêu và danh mục sẽ bị xoá vĩnh viễn. Hành động này không thể hoàn tác."
      />

      <ConfirmModal
        isOpen={showDelGoal}
        onClose={() => setShowDelGoal(false)}
        onConfirm={() => delGoalId && handleDeleteGoal(delGoalId)}
        title="Xoá mục tiêu?"
        description="Bạn có chắc chắn muốn xoá mục tiêu tiết kiệm này?"
      />

      <ConfirmModal
        isOpen={showDelCat}
        onClose={() => setShowDelCat(false)}
        onConfirm={() => delCatId && handleDeleteCategory(delCatId)}
        title="Xoá danh mục?"
        description="Cảnh báo: Tất cả giao dịch liên quan đến danh mục này cũng sẽ bị xoá!"
      />

      <ConfirmModal
        isOpen={showDelTx}
        onClose={() => setShowDelTx(false)}
        onConfirm={async () => {
          if (delTxId) {
            await financeService.deleteTransaction(delTxId);
            toast.success('Đã xoá giao dịch');
            refreshSum();
            window.location.reload(); 
          }
        }}
        title="Xoá giao dịch?"
        description="Bạn có chắc muốn xoá giao dịch này?"
      />
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function CategoryModal({ onClose, categories, onRefresh }: { onClose: () => void; categories: import('@/services/finance/financeService').FinanceCategory[]; onRefresh: () => void; }) {
  const [name, setName] = useState('');
  const [type, setType] = useState(1);
  const [color, setColor] = useState('#8b5cf6');
  const [submitting, setSubmitting] = useState(false);

  const handleAdd = async () => {
    if (!name) return;
    setSubmitting(true);
    try {
      await financeService.createCategory({ name, type, colorHex: color });
      setName('');
      onRefresh();
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    await financeService.deleteCategory(id);
    toast.success('Đã xoá danh mục');
    onRefresh();
  };

  const incomes = categories.filter(c => c.type === 0);
  const expenses = categories.filter(c => c.type === 1);

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-background/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg rounded-2xl border bg-card shadow-xl overflow-hidden flex flex-col max-h-[85vh]">
        <div className="p-5 border-b flex justify-between items-center">
          <h3 className="font-bold text-lg">Quản lý danh mục</h3>
          <button onClick={onClose} className="h-8 w-8 rounded-full hover:bg-muted flex items-center justify-center">
            <Trash2 className="h-4 w-4 opacity-0" />{/* Spacer */}
            <span className="text-xl leading-none">&times;</span>
          </button>
        </div>
        
        <div className="p-5 overflow-y-auto space-y-6 flex-1">
          {/* Form thêm mới */}
          <div className="space-y-3 p-4 border rounded-xl bg-muted/20">
            <p className="text-sm font-semibold">Thêm danh mục mới</p>
            <div className="flex gap-2">
              <button onClick={() => setType(0)} className={`flex-1 h-9 rounded-xl text-xs font-medium transition ${type === 0 ? 'bg-primary text-primary-foreground' : 'border hover:bg-muted'}`}>Thu nhập</button>
              <button onClick={() => setType(1)} className={`flex-1 h-9 rounded-xl text-xs font-medium transition ${type === 1 ? 'bg-primary text-primary-foreground' : 'border hover:bg-muted'}`}>Chi tiêu</button>
            </div>
            <div className="flex gap-2">
              <input type="color" value={color} onChange={e => setColor(e.target.value)} className="h-10 w-12 rounded-xl border p-1 cursor-pointer" />
              <input placeholder="Tên danh mục..." value={name} onChange={e => setName(e.target.value)} className="flex-1 h-10 rounded-xl border px-3 text-sm focus:ring-2 focus:ring-primary/50 outline-none" />
              <button onClick={handleAdd} disabled={!name || submitting} className="h-10 px-4 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition text-sm flex items-center gap-2">
                {submitting && <Loader2 className="h-3 w-3 animate-spin" />} Thêm
              </button>
            </div>
          </div>

          {/* Danh sách */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase mb-3">Thu nhập</p>
              <div className="space-y-2">
                {incomes.map(c => (
                  <div key={c.id} className="flex items-center justify-between p-2 rounded-lg border bg-card hover:border-primary/50 transition">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: c.colorHex || '#ccc' }} />
                      <span className="text-sm font-medium">{c.name}</span>
                    </div>
                    <button onClick={() => handleDelete(c.id)} className="text-muted-foreground hover:text-destructive transition"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                ))}
                {!incomes.length && <p className="text-xs text-muted-foreground italic">Trống</p>}
              </div>
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase mb-3">Chi tiêu</p>
              <div className="space-y-2">
                {expenses.map(c => (
                  <div key={c.id} className="flex items-center justify-between p-2 rounded-lg border bg-card hover:border-primary/50 transition">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: c.colorHex || '#ccc' }} />
                      <span className="text-sm font-medium">{c.name}</span>
                    </div>
                    <button onClick={() => handleDelete(c.id)} className="text-muted-foreground hover:text-destructive transition"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                ))}
                {!expenses.length && <p className="text-xs text-muted-foreground italic">Trống</p>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, sub, color, valueClass = '' }: {
  icon: React.ReactNode; label: string; value: string; sub: string; color: string; valueClass?: string;
}) {
  return (
    <div className="stat-card space-y-2">
      <div className={`inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${color} text-white shadow-md`}>{icon}</div>
      <p className={`text-2xl font-bold ${valueClass}`}>{value}</p>
      <p className="text-xs font-medium text-foreground/80">{label}</p>
      <p className="text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}

function EmptyChart({ text }: { text: string }) {
  return (
    <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">{text}</div>
  );
}

function GoalCard({ goal, onDelete, onRefresh, onEdit }: { goal: import('@/services/finance/financeService').SavingGoal; onDelete: (id: string) => void; onRefresh: () => void; onEdit: (goal: import('@/services/finance/financeService').SavingGoal) => void; }) {
  const pct = Math.min(100, goal.progressPercent);
  const statusColors = ['text-blue-500', 'text-emerald-500', 'text-muted-foreground'];
  const statusLabels = ['Đang thực hiện', 'Hoàn thành', 'Đã huỷ'];

  const addAmount = async (amount: number) => {
    await financeService.updateSavingGoal(goal.id, {
      name: goal.name,
      targetAmount: goal.targetAmount,
      currentAmount: Math.min(goal.targetAmount, goal.currentAmount + amount),
      targetDate: goal.targetDate,
      status: goal.currentAmount + amount >= goal.targetAmount ? 1 : goal.status,
    });
    onRefresh();
  };

  return (
    <div className="bg-card rounded-xl border p-4 space-y-3 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="font-semibold text-sm">{goal.name}</p>
          <p className={`text-xs ${statusColors[goal.status]}`}>{statusLabels[goal.status]}</p>
        </div>
        <div className="flex gap-1">
          <button onClick={() => onEdit(goal)} className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition">
            <Edit className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => onDelete(goal.id)} className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">{goal.currentAmount.toLocaleString()}đ</span>
          <span className="font-medium">{goal.targetAmount.toLocaleString()}đ</span>
        </div>
        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-primary to-violet-400 transition-all duration-500"
            style={{ width: `${pct}%` }} />
        </div>
        <p className="text-xs text-right font-semibold text-primary">{pct.toFixed(1)}%</p>
      </div>

      {goal.targetDate && (
        <p className="text-xs text-muted-foreground">Mục tiêu: {new Date(goal.targetDate).toLocaleDateString('vi-VN')}</p>
      )}

      {goal.status === 0 && (
        <div className="flex gap-1.5 flex-wrap">
          {[50000, 100000, 500000].map(amt => (
            <button key={amt} onClick={() => addAmount(amt)}
              className="text-xs px-2.5 py-1 rounded-lg border border-primary/30 text-primary hover:bg-primary/10 transition">
              +{fmtVnd(amt)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function TransactionList({ month, year, onRefresh: _onRefresh, onEdit }: { month: number; year: number; onRefresh: () => void; onEdit: (tx: import('@/services/finance/financeService').Transaction) => void; }) {
  const { transactions, loading, refresh } = useTransactions({ month, year });

  if (loading) return <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  if (!transactions.length) return <div className="text-sm text-center text-muted-foreground py-6">Chưa có giao dịch trong tháng này</div>;

  return (
    <div className="divide-y divide-border/40 max-h-72 overflow-y-auto pr-2">
      {transactions.map(tx => (
        <div key={tx.id} className="flex items-center justify-between py-3 hover:bg-muted/20 px-2 rounded-lg transition group">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full flex items-center justify-center text-sm"
              style={{ background: tx.categoryColor ? `${tx.categoryColor}22` : '#8b5cf622', color: tx.categoryColor ?? '#8b5cf6' }}>
              {tx.categoryIcon ?? '💰'}
            </div>
            <div>
              <p className="text-sm font-medium">{tx.categoryName}</p>
              <p className="text-xs text-muted-foreground">{tx.note ?? new Date(tx.transactionDate).toLocaleDateString('vi-VN')}</p>
            </div>
          </div>
          <div className="text-right flex items-center gap-4">
            <div>
              <p className={`text-sm font-semibold ${tx.type === 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                {tx.type === 0 ? '+' : '-'}{tx.amount.toLocaleString()}đ
              </p>
              <p className="text-xs text-muted-foreground">{new Date(tx.transactionDate).toLocaleDateString('vi-VN')}</p>
            </div>
            <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition">
              <button onClick={() => onEdit(tx)} className="text-muted-foreground hover:text-primary">
                <Edit className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => { setDelTxId(tx.id); setShowDelTx(true); }} className="text-muted-foreground hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}


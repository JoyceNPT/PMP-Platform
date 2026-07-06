import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import {
  TrendingUp, TrendingDown, Wallet, PiggyBank,
  Plus, Trash2, Edit, Bot, ChevronLeft, ChevronRight, Loader2,
  Users, Copy, Send, Check, X, LogOut, Backpack, Landmark, Gem,
  Crown, ScrollText, Coins, BriefcaseBusiness, HandCoins, WalletCards,
  UtensilsCrossed, CarFront, GraduationCap, House, Plane, Gamepad2,
  Music, Shirt, Coffee, Dumbbell, HeartPulse, Sparkles, BookOpen,
  ReceiptText, ShoppingBag, Gift, Palette, Wrench, Fuel, Smartphone,
  Image as ImageIcon, Upload
} from 'lucide-react';
import { useFinanceSummary, useSavingGoals, useAiPrediction, useCategories, useTransactions, useFinanceSharing } from '@/features/finance/components/useFinance';
import { financeService, type FinanceSharingOverview } from '@/services/finance/financeService';
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

const FINANCE_ICONS = [
  { key: 'backpack', label: 'Balo', Icon: Backpack },
  { key: 'landmark', label: 'Ngân hàng', Icon: Landmark },
  { key: 'gem', label: 'Đá quý', Icon: Gem },
  { key: 'crown', label: 'Vương miện', Icon: Crown },
  { key: 'scroll', label: 'Cuộn giấy', Icon: ScrollText },
  { key: 'coins', label: 'Xu cổ', Icon: Coins },
  { key: 'briefcase', label: 'Cặp việc', Icon: BriefcaseBusiness },
  { key: 'hand-coins', label: 'Nhận tiền', Icon: HandCoins },
  { key: 'wallet-cards', label: 'Ví thẻ', Icon: WalletCards },
  { key: 'utensils', label: 'Ăn uống', Icon: UtensilsCrossed },
  { key: 'car', label: 'Xe', Icon: CarFront },
  { key: 'graduation-cap', label: 'Học tập', Icon: GraduationCap },
  { key: 'home', label: 'Nhà', Icon: House },
  { key: 'plane', label: 'Du lịch', Icon: Plane },
  { key: 'gamepad', label: 'Giải trí', Icon: Gamepad2 },
  { key: 'music', label: 'Âm nhạc', Icon: Music },
  { key: 'shirt', label: 'Thời trang', Icon: Shirt },
  { key: 'coffee', label: 'Cafe', Icon: Coffee },
  { key: 'dumbbell', label: 'Thể thao', Icon: Dumbbell },
  { key: 'heart-pulse', label: 'Sức khỏe', Icon: HeartPulse },
  { key: 'sparkles', label: 'Làm đẹp', Icon: Sparkles },
  { key: 'book', label: 'Sách', Icon: BookOpen },
  { key: 'receipt', label: 'Hóa đơn', Icon: ReceiptText },
  { key: 'shopping-bag', label: 'Mua sắm', Icon: ShoppingBag },
  { key: 'gift', label: 'Quà tặng', Icon: Gift },
  { key: 'palette', label: 'Sáng tạo', Icon: Palette },
  { key: 'wrench', label: 'Sửa chữa', Icon: Wrench },
  { key: 'fuel', label: 'Xăng xe', Icon: Fuel },
  { key: 'smartphone', label: 'Điện thoại', Icon: Smartphone },
];

const FINANCE_ICON_MAP = new Map(FINANCE_ICONS.map(item => [item.key, item.Icon]));

function FinanceCategoryIcon({ icon, className = 'h-4 w-4' }: { icon?: string | null; className?: string }) {
  const Icon = FINANCE_ICON_MAP.get(icon || '') ?? Coins;
  return <Icon className={className} />;
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export function FinancePage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear]   = useState(now.getFullYear());

  const { summary, loading: loadSum, refresh: refreshSum } = useFinanceSummary(year, month);
  const { goals, loading: loadGoals, refresh: refreshGoals } = useSavingGoals();
  const [aiScope, setAiScope] = useState<'personal' | 'group'>('group');
  const { prediction, loading: loadPred, refresh: refreshPred } = useAiPrediction(aiScope);
  const { categories, refresh: refreshCats } = useCategories();
  const [sharingVersion, setSharingVersion] = useState(0);
  const handleSharingChanged = useCallback(() => {
    refreshSum();
    setSharingVersion(v => v + 1);
  }, [refreshSum]);
  const { sharing, loading: loadSharing, refresh: refreshSharing } = useFinanceSharing(handleSharingChanged);

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
  const [txAttachmentUrl, setTxAttachmentUrl] = useState('');
  const [txAttachmentFile, setTxAttachmentFile] = useState<File | null>(null);
  const [txAttachmentPreview, setTxAttachmentPreview] = useState('');

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

  const resetTxAttachment = useCallback(() => {
    setTxAttachmentFile(currentFile => {
      if (currentFile && txAttachmentPreview.startsWith('blob:')) {
        URL.revokeObjectURL(txAttachmentPreview);
      }
      return null;
    });
    setTxAttachmentPreview('');
    setTxAttachmentUrl('');
  }, [txAttachmentPreview]);

  const handleAttachmentSelect = (file?: File | null) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Chỉ hỗ trợ upload file ảnh.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ảnh tối đa 5MB.');
      return;
    }
    if (txAttachmentFile && txAttachmentPreview.startsWith('blob:')) {
      URL.revokeObjectURL(txAttachmentPreview);
    }
    setTxAttachmentFile(file);
    setTxAttachmentPreview(URL.createObjectURL(file));
    setTxAttachmentUrl('');
  };

  useEffect(() => {
    return () => {
      if (txAttachmentPreview.startsWith('blob:')) {
        URL.revokeObjectURL(txAttachmentPreview);
      }
    };
  }, [txAttachmentPreview]);

  const handleAddTx = async () => {
    if (!txAmount || !txCatId) return;
    if (new Date(txDate) > new Date()) {
      toast.error('Không thể nhập giao dịch trong tương lai. Vui lòng chọn ngày hôm nay hoặc quá khứ.');
      return;
    }
    setTxSubmitting(true);
    try {
      const attachmentUrl = txAttachmentFile
        ? await financeService.uploadFinanceAttachment(txAttachmentFile)
        : txAttachmentUrl || undefined;
      const data = {
        categoryId: txCatId,
        type: txType,
        amount: parseFloat(txAmount),
        transactionDate: txDate,
        note: txNote || undefined,
        attachmentUrl,
      };
      if (editingTxId) {
        await financeService.updateTransaction(editingTxId, data);
      } else {
        await financeService.createTransaction(data);
      }
      setShowAdd(false);
      setEditingTxId(null);
      setTxAmount(''); setTxNote(''); setTxCatId('');
      resetTxAttachment();
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Quản lý tài chính</h1>
          <p className="page-subtitle">Theo dõi thu chi, tiết kiệm và dự báo chi tiêu AI</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setShowResetConfirm(true)}
            className="flex items-center gap-2 h-9 px-3 sm:px-4 rounded-xl border border-destructive/30 text-destructive text-xs sm:text-sm font-medium hover:bg-destructive/10 transition whitespace-nowrap">
            <Trash2 className="h-4 w-4 shrink-0" /> Reset
          </button>
          <button onClick={() => setShowCategoryModal(true)}
            className="flex items-center gap-2 h-9 px-3 sm:px-4 rounded-xl bg-muted text-foreground text-xs sm:text-sm font-medium hover:bg-muted/80 transition whitespace-nowrap">
            Danh mục
          </button>
          <button onClick={() => {
            setEditingTxId(null);
            setTxAmount(''); setTxNote(''); setTxCatId('');
            resetTxAttachment();
            setShowAdd(true);
          }}
            className="flex items-center gap-2 h-9 px-3 sm:px-4 rounded-xl bg-primary text-primary-foreground text-xs sm:text-sm font-medium hover:bg-primary/90 transition shadow shadow-primary/20 whitespace-nowrap">
            <Plus className="h-4 w-4 shrink-0" /> Thêm giao dịch
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

      <FinanceSharingPanel
        sharing={sharing}
        loading={loadSharing}
        onRefresh={() => {
          refreshSharing();
          refreshSum();
          setSharingVersion(v => v + 1);
        }}
      />

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
          key={`${year}-${month}-${sharingVersion}`}
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
             setTxAttachmentFile(null);
             setTxAttachmentUrl(tx.attachmentUrl || '');
             setTxAttachmentPreview(tx.attachmentUrl || '');
             setShowAdd(true);
          }}
          onDelete={(id) => {
            setDelTxId(id);
            setShowDelTx(true);
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
      <div className="rounded-2xl border glass bg-gradient-to-br from-primary/5 to-accent/5 p-6 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Bot className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-base">Gợi ý tài chính từ AI</h3>
              {prediction?.confidence && (
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                  Độ tin cậy: {Math.round(prediction.confidence * 100)}%
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-xl border bg-background p-1">
              <button onClick={() => setAiScope('personal')} className={`h-8 rounded-lg px-3 text-xs font-bold ${aiScope === 'personal' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                Cá nhân
              </button>
              <button onClick={() => setAiScope('group')} className={`h-8 rounded-lg px-3 text-xs font-bold ${aiScope === 'group' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                Gộp
              </button>
            </div>
            <button 
              onClick={() => refreshPred(true)} 
              disabled={loadPred}
              className="flex items-center gap-2 h-9 px-4 rounded-xl border border-primary/20 text-primary text-xs font-bold hover:bg-primary/10 transition disabled:opacity-50"
            >
              {loadPred ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <TrendingUp className="h-3.5 w-3.5" />}
              Làm mới gợi ý
            </button>
          </div>
        </div>

        {loadPred ? (
          <div className="py-8 flex flex-col items-center justify-center gap-3 text-sm text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
            <p className="animate-pulse">Gemini đang phân tích dữ liệu của bạn...</p>
          </div>
        ) : prediction ? (
          <div className="grid md:grid-cols-3 gap-6 items-center">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-bold uppercase tracking-tight">Dự báo chi {prediction.month}</p>
              <p className="text-3xl font-black text-primary tracking-tighter">{prediction.predictedAmount.toLocaleString()}đ</p>
            </div>
            <div className="md:col-span-2 bg-white/40 dark:bg-black/20 rounded-xl p-4 border border-white/20">
              <p className="text-sm leading-relaxed font-medium italic">"{prediction.insight}"</p>
            </div>
          </div>
        ) : (
          <div className="py-4 text-sm text-muted-foreground italic text-center">
            Chưa có dữ liệu dự báo. Hãy nhấn "Làm mới gợi ý" để bắt đầu.
          </div>
        )}
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

            <div className="rounded-xl border border-dashed bg-muted/10 p-3 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                  <ImageIcon className="h-4 w-4" />
                  Ảnh hoá đơn / minh chứng
                </label>
                {txAttachmentPreview && (
                  <button
                    type="button"
                    onClick={resetTxAttachment}
                    className="text-xs font-medium text-destructive hover:underline"
                  >
                    Gỡ ảnh
                  </button>
                )}
              </div>

              {txAttachmentPreview ? (
                <a href={txAttachmentPreview} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-lg border bg-background">
                  <img src={txAttachmentPreview} alt="Ảnh giao dịch" className="h-32 w-full object-cover" />
                </a>
              ) : (
                <label className="flex h-24 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border bg-background text-xs text-muted-foreground transition hover:bg-muted">
                  <Upload className="h-5 w-5" />
                  Chọn ảnh từ thiết bị
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => handleAttachmentSelect(e.target.files?.[0])}
                  />
                </label>
              )}
            </div>

            <div className="flex gap-3 justify-end pt-1">
              <button onClick={() => { setShowAdd(false); resetTxAttachment(); }} className="h-10 px-4 rounded-xl border text-sm hover:bg-muted transition">Huỷ</button>
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
            setSharingVersion(v => v + 1);
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
  const [icon, setIcon] = useState('coins');
  const [submitting, setSubmitting] = useState(false);

  const handleAdd = async () => {
    if (!name) return;
    setSubmitting(true);
    try {
      await financeService.createCategory({
        name,
        type,
        icon,
        colorHex: type === 0 ? '#10b981' : '#8b5cf6',
      });
      setName('');
      setIcon('coins');
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
            <div className="grid grid-cols-6 sm:grid-cols-8 gap-2">
              {FINANCE_ICONS.map(item => (
                <button
                  key={item.key}
                  type="button"
                  title={item.label}
                  onClick={() => setIcon(item.key)}
                  className={`flex h-10 w-10 items-center justify-center rounded-xl border transition ${
                    icon === item.key ? 'border-primary bg-primary text-primary-foreground' : 'bg-background hover:bg-muted'
                  }`}
                >
                  <item.Icon className="h-4 w-4" />
                </button>
              ))}
            </div>
            <div className="flex gap-2">
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
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <FinanceCategoryIcon icon={c.icon} className="h-3.5 w-3.5" />
                      </div>
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
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <FinanceCategoryIcon icon={c.icon} className="h-3.5 w-3.5" />
                      </div>
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

function FinanceSharingPanel({ sharing, loading, onRefresh }: { sharing: FinanceSharingOverview | null; loading: boolean; onRefresh: () => void }) {
  const [inviteCode, setInviteCode] = useState('');
  const [groupName, setGroupName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [renaming, setRenaming] = useState(false);

  useEffect(() => {
    setGroupName(sharing?.activeGroup?.name ?? '');
  }, [sharing?.activeGroup?.name]);

  const copyInviteCode = async () => {
    if (!sharing?.inviteCode) return;
    await navigator.clipboard.writeText(sharing.inviteCode);
    toast.success('Đã sao chép mã mời');
  };

  const handleInvite = async () => {
    if (!inviteCode.trim()) {
      toast.error('Vui lòng nhập mã mời');
      return;
    }

    setSubmitting(true);
    try {
      await financeService.createGroupInvite(inviteCode.trim());
      setInviteCode('');
      toast.success('Đã gửi lời mời gộp tài chính');
      onRefresh();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không thể gửi lời mời');
    } finally {
      setSubmitting(false);
    }
  };

  const acceptInvite = async (id: string) => {
    await financeService.acceptGroupInvite(id);
    toast.success('Đã chấp nhận lời mời');
    onRefresh();
  };

  const rejectInvite = async (id: string) => {
    await financeService.rejectGroupInvite(id);
    toast.success('Đã từ chối lời mời');
    onRefresh();
  };

  const cancelInvite = async (id: string) => {
    await financeService.cancelGroupInvite(id);
    toast.success('Đã huỷ lời mời');
    onRefresh();
  };

  const leaveGroup = async () => {
    if (!window.confirm('Bạn có chắc muốn rời nhóm tài chính gộp? Dữ liệu thu chi của bạn vẫn được giữ nguyên.')) return;
    await financeService.leaveActiveGroup();
    toast.success('Đã rời nhóm tài chính');
    onRefresh();
  };

  const renameGroup = async () => {
    if (!groupName.trim()) {
      toast.error('Tên tài khoản gộp không được để trống');
      return;
    }

    setRenaming(true);
    try {
      await financeService.updateActiveGroup(groupName.trim());
      toast.success('Đã đổi tên tài khoản gộp');
      onRefresh();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không thể đổi tên tài khoản gộp');
    } finally {
      setRenaming(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border bg-card p-4">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border bg-card p-4 sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold">Gộp tài chính</h3>
              <p className="text-xs text-muted-foreground">Mời người khác để cùng xem thu chi trong một nhóm.</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-medium text-muted-foreground">Mã mời của bạn</span>
            <button
              onClick={copyInviteCode}
              className="inline-flex items-center gap-1.5 rounded-lg bg-muted px-2.5 py-1.5 font-mono font-bold text-foreground"
            >
              {sharing?.inviteCode || '...'}
              <Copy className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div className="flex w-full flex-col gap-2 sm:flex-row lg:max-w-md">
          <input
            value={inviteCode}
            onChange={e => setInviteCode(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === 'Enter' && handleInvite()}
            placeholder="Nhập mã mời, VD: FIN-123456"
            className="h-10 min-w-0 flex-1 rounded-xl border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <button
            onClick={handleInvite}
            disabled={submitting}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Mời
          </button>
        </div>
      </div>

      {sharing?.activeGroup && (
        <div className="mt-4 rounded-xl bg-muted/40 p-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase text-muted-foreground">Nhóm đang gộp</p>
              <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-center">
                <input
                  value={groupName}
                  onChange={e => setGroupName(e.target.value)}
                  className="h-9 min-w-0 rounded-lg border bg-background px-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <button
                  onClick={renameGroup}
                  disabled={renaming || groupName.trim() === sharing.activeGroup.name}
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border px-3 text-xs font-bold hover:bg-muted disabled:opacity-50"
                >
                  {renaming ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Edit className="h-3.5 w-3.5" />}
                  Lưu tên
                </button>
              </div>
            </div>
            <button onClick={leaveGroup} className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border px-3 text-xs font-bold text-destructive hover:bg-destructive/10">
              <LogOut className="h-3.5 w-3.5" /> Rời nhóm
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {sharing.activeGroup.members.map(member => (
              <span key={member.userId} className="inline-flex max-w-full items-center rounded-lg bg-background px-2.5 py-1.5 text-xs font-semibold">
                <span className="min-w-0 break-words">{member.displayName}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {(sharing?.incomingInvites.length || sharing?.outgoingInvites.length) ? (
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {sharing.incomingInvites.length > 0 && (
            <div className="rounded-xl border p-3">
              <p className="mb-2 text-xs font-bold uppercase text-muted-foreground">Lời mời đến</p>
              <div className="space-y-2">
                {sharing.incomingInvites.map(invite => (
                  <div key={invite.id} className="flex flex-col gap-2 rounded-lg bg-muted/40 p-2 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm"><b>{invite.inviterName}</b> mời bạn vào nhóm <b>{invite.groupName}</b></p>
                    <div className="flex gap-2">
                      <button onClick={() => acceptInvite(invite.id)} className="inline-flex h-8 items-center gap-1 rounded-lg bg-emerald-500 px-2.5 text-xs font-bold text-white">
                        <Check className="h-3.5 w-3.5" /> Nhận
                      </button>
                      <button onClick={() => rejectInvite(invite.id)} className="inline-flex h-8 items-center gap-1 rounded-lg bg-muted px-2.5 text-xs font-bold">
                        <X className="h-3.5 w-3.5" /> Từ chối
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {sharing.outgoingInvites.length > 0 && (
            <div className="rounded-xl border p-3">
              <p className="mb-2 text-xs font-bold uppercase text-muted-foreground">Lời mời đã gửi</p>
              <div className="space-y-2">
                {sharing.outgoingInvites.map(invite => (
                  <div key={invite.id} className="flex flex-col gap-2 rounded-lg bg-muted/40 p-2 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm">Đang chờ <b>{invite.inviteeName}</b> chấp nhận</p>
                    <button onClick={() => cancelInvite(invite.id)} className="inline-flex h-8 items-center justify-center gap-1 rounded-lg bg-muted px-2.5 text-xs font-bold">
                      <X className="h-3.5 w-3.5" /> Huỷ
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
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

function TransactionList({ month, year, onRefresh: _onRefresh, onEdit, onDelete }: {
  month: number;
  year: number;
  onRefresh: () => void;
  onEdit: (tx: import('@/services/finance/financeService').Transaction) => void;
  onDelete: (id: string) => void;
}) {
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
              <FinanceCategoryIcon icon={tx.categoryIcon} className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-medium">{tx.categoryName}</p>
              <p className="text-xs text-muted-foreground">
                {tx.note ?? new Date(tx.transactionDate).toLocaleDateString('vi-VN')}
                {tx.ownerName ? ` · ${tx.ownerName}` : ''}
              </p>
              {tx.attachmentUrl && (
                <a
                  href={tx.attachmentUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                >
                  <ImageIcon className="h-3 w-3" />
                  Ảnh
                </a>
              )}
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
              <button onClick={() => onDelete(tx.id)} className="text-muted-foreground hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

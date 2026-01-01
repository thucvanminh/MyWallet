import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Modal,
    TextInput,
    Alert
} from 'react-native';
import { useWallet } from '../context/WalletContext';
import { TransactionType, Category } from '../types';
import { format } from 'date-fns';
import { Trash2, Plus, X, AlertCircle } from 'lucide-react-native';
import { IconByName, IconPicker } from './IconUtils';
import { Picker } from '@react-native-picker/picker';

type Tab = 'history' | 'categories';

export const Transactions: React.FC = () => {
    const { transactions, categories, addTransaction, deleteTransaction, addCategory, deleteCategory } = useWallet();
    const [activeTab, setActiveTab] = useState<Tab>('history');

    // Transaction Modal State
    const [isTxModalOpen, setIsTxModalOpen] = useState(false);
    const [txType, setTxType] = useState<TransactionType>(TransactionType.EXPENSE);
    const [amount, setAmount] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [note, setNote] = useState('');
    const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));

    // Category State
    const [newCatName, setNewCatName] = useState('');
    const [newCatType, setNewCatType] = useState<TransactionType>(TransactionType.EXPENSE);
    const [newCatIcon, setNewCatIcon] = useState('Tag');

    const formatCurrency = (val: string) => {
        // Remove everything except numbers
        const clean = val.replace(/\D/g, '');
        if (!clean) return '';
        // Add dots every 3 digits
        return clean.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    };

    const handleAmountChange = (val: string) => {
        setAmount(formatCurrency(val));
    };

    const handleTxSubmit = () => {
        if (!amount || !categoryId) {
            Alert.alert('Error', 'Please fill in all required fields');
            return;
        }
        addTransaction({
            category_id: categoryId,
            amount: parseFloat(amount.replace(/\./g, '')),
            note,
            date: new Date(date).toISOString(),
        });
        closeTxModal();
    };

    const handleCatSubmit = () => {
        if (!newCatName.trim()) return;
        addCategory({
            name: newCatName,
            type: newCatType,
            icon: newCatIcon,
            color: '#' + Math.floor(Math.random() * 16777215).toString(16),
        });
        setNewCatName('');
        setNewCatIcon('Tag');
    };

    const closeTxModal = () => {
        setIsTxModalOpen(false);
        setAmount('');
        setNote('');
        setCategoryId('');
        setDate(format(new Date(), 'yyyy-MM-dd'));
    };

    const filteredCategories = categories.filter(c => c.type === txType);

    return (
        <View style={styles.container}>
            {/* Top Bar */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>
                    {activeTab === 'history' ? 'Transactions' : 'Categories'}
                </Text>
                {activeTab === 'history' && (
                    <TouchableOpacity
                        onPress={() => setIsTxModalOpen(true)}
                        style={styles.fab}
                    >
                        <Plus size={24} color="#ffffff" />
                    </TouchableOpacity>
                )}
            </View>

            {/* Tabs */}
            <View style={styles.tabs}>
                <TouchableOpacity
                    onPress={() => setActiveTab('history')}
                    style={[styles.tab, activeTab === 'history' && styles.activeTab]}
                >
                    <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>History</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => setActiveTab('categories')}
                    style={[styles.tab, activeTab === 'categories' && styles.activeTab]}
                >
                    <Text style={[styles.tabText, activeTab === 'categories' && styles.activeTabText]}>Categories</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* History Tab */}
                {activeTab === 'history' && (
                    <View style={styles.listContainer}>
                        {transactions.length === 0 ? (
                            <Text style={styles.emptyText}>No transactions found.</Text>
                        ) : (
                            transactions
                                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                .map((t) => {
                                    const cat = categories.find((c) => c.id === t.category_id);
                                    return (
                                        <View key={t.id} style={styles.card}>
                                            <View style={styles.txLeft}>
                                                <View style={[styles.iconBg, { backgroundColor: cat?.color || '#94a3b8' }]}>
                                                    <IconByName name={cat?.icon || 'Tag'} size={20} color="#ffffff" />
                                                </View>
                                                <View>
                                                    <Text style={styles.txName}>{cat?.name}</Text>
                                                    <Text style={styles.txMeta}>{format(new Date(t.date), 'MMM dd')} • {t.note || 'No note'}</Text>
                                                </View>
                                            </View>
                                            <View style={styles.txRight}>
                                                <Text style={[
                                                    styles.txAmount,
                                                    { color: cat?.type === TransactionType.INCOME ? '#059669' : '#1e293b' }
                                                ]}>
                                                    {cat?.type === TransactionType.INCOME ? '+' : '-'}${t.amount.toLocaleString()}
                                                </Text>
                                                <TouchableOpacity onPress={() => deleteTransaction(t.id)}>
                                                    <Trash2 size={16} color="#94a3b8" />
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    );
                                })
                        )}
                    </View>
                )}

                {/* Categories Tab */}
                {activeTab === 'categories' && (
                    <View style={styles.listContainer}>
                        {/* New Category Form */}
                        <View style={styles.formCard}>
                            <Text style={styles.formTitle}>Add New Category</Text>
                            <View style={styles.formRow}>
                                <View style={styles.pickerWrapper}>
                                    <Picker
                                        selectedValue={newCatType}
                                        onValueChange={(val) => setNewCatType(val)}
                                        style={styles.typePicker}
                                    >
                                        <Picker.Item label="Expense" value={TransactionType.EXPENSE} />
                                        <Picker.Item label="Income" value={TransactionType.INCOME} />
                                    </Picker>
                                </View>
                                <TextInput
                                    style={styles.nameInput}
                                    value={newCatName}
                                    onChangeText={setNewCatName}
                                    placeholder="Name"
                                />
                            </View>
                            <Text style={styles.label}>Select Icon:</Text>
                            <IconPicker selectedIcon={newCatIcon} onSelect={setNewCatIcon} />

                            <TouchableOpacity onPress={handleCatSubmit} style={styles.addCatButton}>
                                <Plus size={16} color="#ffffff" />
                                <Text style={styles.addCatButtonText}>Create Category</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Categories List */}
                        <View style={styles.catList}>
                            {categories.map((c) => (
                                <View key={c.id} style={styles.catItem}>
                                    <View style={styles.catLeft}>
                                        <View style={[styles.catIconBg, { backgroundColor: c.color || '#94a3b8' }]}>
                                            <IconByName name={c.icon} size={16} color="#ffffff" />
                                        </View>
                                        <View>
                                            <Text style={styles.catName}>{c.name}</Text>
                                            <Text style={styles.catType}>{c.type.toLowerCase()}</Text>
                                        </View>
                                    </View>
                                    {c.user_id ? (
                                        <TouchableOpacity onPress={() => deleteCategory(c.id)}>
                                            <Trash2 size={16} color="#cbd5e1" />
                                        </TouchableOpacity>
                                    ) : (
                                        <AlertCircle size={16} color="#f1f5f9" />
                                    )}
                                </View>
                            ))}
                        </View>
                    </View>
                )}
            </ScrollView>

            {/* Add Transaction Modal */}
            <Modal
                visible={isTxModalOpen}
                animationType="slide"
                transparent
                onRequestClose={closeTxModal}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>New Transaction</Text>
                            <TouchableOpacity onPress={closeTxModal}>
                                <X size={24} color="#94a3b8" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.typeToggle}>
                            <TouchableOpacity
                                onPress={() => { setTxType(TransactionType.EXPENSE); setCategoryId(''); }}
                                style={[styles.toggleBtn, txType === TransactionType.EXPENSE && styles.activeExpenseToggle]}
                            >
                                <Text style={[styles.toggleBtnText, txType === TransactionType.EXPENSE && styles.activeToggleText]}>Expense</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => { setTxType(TransactionType.INCOME); setCategoryId(''); }}
                                style={[styles.toggleBtn, txType === TransactionType.INCOME && styles.activeIncomeToggle]}
                            >
                                <Text style={[styles.toggleBtnText, txType === TransactionType.INCOME && styles.activeToggleText]}>Income</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Amount</Text>
                            <TextInput
                                style={styles.amountInput}
                                value={amount}
                                onChangeText={handleAmountChange}
                                keyboardType="numeric"
                                placeholder="0"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Category</Text>
                            <View style={styles.pickerBorder}>
                                <Picker
                                    selectedValue={categoryId}
                                    onValueChange={(val) => setCategoryId(val)}
                                >
                                    <Picker.Item label="Select Category" value="" enabled={false} />
                                    {filteredCategories.map(c => (
                                        <Picker.Item key={c.id} label={c.name} value={c.id} />
                                    ))}
                                </Picker>
                            </View>
                        </View>

                        <View style={styles.row}>
                            <View style={[styles.inputGroup, { flex: 1 }]}>
                                <Text style={styles.inputLabel}>Date (YYYY-MM-DD)</Text>
                                <TextInput
                                    style={styles.textInput}
                                    value={date}
                                    onChangeText={setDate}
                                    placeholder="2024-01-01"
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Note (Optional)</Text>
                            <TextInput
                                style={styles.textInput}
                                value={note}
                                onChangeText={setNote}
                                placeholder="Lunch..."
                            />
                        </View>

                        <TouchableOpacity
                            onPress={handleTxSubmit}
                            style={[
                                styles.saveBtn,
                                { backgroundColor: txType === TransactionType.EXPENSE ? '#ef4444' : '#10b981' }
                            ]}
                        >
                            <Text style={styles.saveBtnText}>Save Transaction</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        paddingBottom: 10,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1e293b',
    },
    fab: {
        backgroundColor: '#4f46e5',
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 4,
        shadowColor: '#4f46e5',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    tabs: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        marginBottom: 10,
        backgroundColor: '#f1f5f9',
        marginHorizontal: 20,
        borderRadius: 12,
        padding: 4,
    },
    tab: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: 8,
    },
    activeTab: {
        backgroundColor: '#ffffff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    tabText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#64748b',
    },
    activeTabText: {
        color: '#4f46e5',
    },
    scrollContent: {
        padding: 20,
        paddingTop: 10,
    },
    listContainer: {
        gap: 12,
    },
    emptyText: {
        textAlign: 'center',
        color: '#94a3b8',
        marginTop: 40,
    },
    card: {
        backgroundColor: '#ffffff',
        padding: 16,
        borderRadius: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    txLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    iconBg: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    txName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1e293b',
    },
    txMeta: {
        fontSize: 12,
        color: '#64748b',
    },
    txRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    txAmount: {
        fontSize: 16,
        fontWeight: '700',
    },
    formCard: {
        backgroundColor: '#ffffff',
        padding: 20,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        gap: 12,
    },
    formTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#334155',
    },
    formRow: {
        flexDirection: 'row',
        gap: 8,
    },
    pickerWrapper: {
        width: 120,
        backgroundColor: '#f8fafc',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        justifyContent: 'center',
    },
    typePicker: {
        height: 44,
    },
    nameInput: {
        flex: 1,
        backgroundColor: '#f8fafc',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        paddingHorizontal: 12,
        fontSize: 14,
    },
    label: {
        fontSize: 12,
        color: '#64748b',
        fontWeight: '600',
    },
    addCatButton: {
        backgroundColor: '#4f46e5',
        paddingVertical: 12,
        borderRadius: 8,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        marginTop: 4,
    },
    addCatButtonText: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: '600',
    },
    catList: {
        gap: 8,
        paddingBottom: 40,
    },
    catItem: {
        backgroundColor: '#ffffff',
        padding: 12,
        borderRadius: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    catLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    catIconBg: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    catName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1e293b',
    },
    catType: {
        fontSize: 10,
        color: '#94a3b8',
        textTransform: 'capitalize',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#ffffff',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: 24,
        paddingBottom: 40,
        gap: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1e293b',
    },
    typeToggle: {
        flexDirection: 'row',
        backgroundColor: '#f1f5f9',
        padding: 4,
        borderRadius: 12,
    },
    toggleBtn: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 8,
    },
    activeExpenseToggle: {
        backgroundColor: '#ffffff',
    },
    activeIncomeToggle: {
        backgroundColor: '#ffffff',
    },
    toggleBtnText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748b',
    },
    activeToggleText: {
        color: '#1e293b',
    },
    inputGroup: {
        gap: 6,
    },
    inputLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#94a3b8',
        textTransform: 'uppercase',
    },
    amountInput: {
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 24,
        fontWeight: '700',
        color: '#1e293b',
    },
    pickerBorder: {
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        overflow: 'hidden',
    },
    row: {
        flexDirection: 'row',
        gap: 16,
    },
    textInput: {
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
    },
    saveBtn: {
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 10,
    },
    saveBtnText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '700',
    },
});

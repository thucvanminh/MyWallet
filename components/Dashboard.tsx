import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Image,
    Modal,
    ActivityIndicator,
    Alert
} from 'react-native';
import { useWallet } from '../context/WalletContext';
import { TransactionType } from '../types';
import { TrendingUp, TrendingDown, Mic, Settings, Calendar, StopCircle } from 'lucide-react-native';
import { format, isWithinInterval } from 'date-fns';
import { processVoiceCommand } from '../services/geminiService';
import { IconByName } from './IconUtils';
import { Picker } from '@react-native-picker/picker';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';

export const Dashboard: React.FC = () => {
    const { transactions, categories, user, updateUser, getBillingCycle, addTransaction } = useWallet();
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [tempStartDay, setTempStartDay] = useState(user?.billing_start_day || 1);

    // Voice Recording State
    const [recording, setRecording] = useState<Audio.Recording | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const { start, end } = getBillingCycle();

    const currentCycleTransactions = transactions.filter(t => {
        const tDate = new Date(t.date);
        return isWithinInterval(tDate, { start, end });
    });

    const totalIncome = currentCycleTransactions
        .filter(t => {
            const cat = categories.find(c => c.id === t.category_id);
            return cat?.type === TransactionType.INCOME;
        })
        .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = currentCycleTransactions
        .filter(t => {
            const cat = categories.find(c => c.id === t.category_id);
            return cat?.type === TransactionType.EXPENSE;
        })
        .reduce((sum, t) => sum + t.amount, 0);

    const balance = totalIncome - totalExpense;

    // --- Voice Logic ---
    async function startRecording() {
        try {
            const permission = await Audio.requestPermissionsAsync();
            if (permission.status === 'granted') {
                await Audio.setAudioModeAsync({
                    allowsRecordingIOS: true,
                    playsInSilentModeIOS: true,
                });

                const { recording } = await Audio.Recording.createAsync(
                    Audio.RecordingOptionsPresets.HIGH_QUALITY
                );
                setRecording(recording);
            } else {
                Alert.alert('Permission Denied', 'Please enable microphone access to use Auto Create.');
            }
        } catch (err) {
            console.error('Failed to start recording', err);
        }
    }

    async function stopRecording() {
        if (!recording) return;
        setRecording(null);
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();

        if (uri) {
            handleVoiceUpload(uri);
        }
    }

    const handleVoiceUpload = async (uri: string) => {
        setIsProcessing(true);
        try {
            // Convert to Base64
            const base64Audio = await FileSystem.readAsStringAsync(uri, {
                encoding: FileSystem.EncodingType.Base64,
            });

            // Process with Gemini
            const extractedTxs = await processVoiceCommand(base64Audio, categories);

            if (extractedTxs && extractedTxs.length > 0) {
                for (const tx of extractedTxs) {
                    // Find category ID by name
                    const category = categories.find(c => c.name.toLowerCase() === tx.category_name.toLowerCase()) || categories[0];

                    await addTransaction({
                        amount: tx.amount,
                        note: tx.note || '',
                        category_id: category.id,
                        date: tx.date || new Date().toISOString()
                    });
                }
                Alert.alert('Success', `Auto-created ${extractedTxs.length} transactions!`);
            } else {
                Alert.alert('Bummer', "I couldn't hear any transactions. Try saying something like 'Pay 50 dollars for transport today'.");
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to process voice command.');
        } finally {
            setIsProcessing(false);
        }
    };

    const saveSettings = () => {
        updateUser({ billing_start_day: tempStartDay });
        setIsSettingsOpen(false);
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.greeting}>Hello, {user?.full_name?.split(' ')[0] || 'User'}</Text>
                    <TouchableOpacity onPress={() => setIsSettingsOpen(true)} style={styles.cycleBadge}>
                        <Calendar size={12} color="#64748b" />
                        <Text style={styles.cycleText}>{format(start, 'dd/MM')} - {format(end, 'dd/MM')}</Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.headerRight}>
                    <TouchableOpacity onPress={() => setIsSettingsOpen(true)} style={styles.iconButton}>
                        <Settings size={20} color="#94a3b8" />
                    </TouchableOpacity>
                    <Image
                        source={{ uri: user?.avatar_url || 'https://picsum.photos/100' }}
                        style={styles.avatar}
                    />
                </View>
            </View>

            {/* Balance Card */}
            <View style={styles.balanceCard}>
                <View style={styles.balanceInfo}>
                    <Text style={styles.balanceLabel}>Cycle Balance</Text>
                    <Text style={styles.balanceAmount}>${balance.toLocaleString()}</Text>

                    <View style={styles.statsGrid}>
                        <View style={styles.statItem}>
                            <View style={styles.statIconBgIncome}>
                                <TrendingUp size={14} color="#6ee7b7" />
                            </View>
                            <View>
                                <Text style={styles.statLabel}>Income</Text>
                                <Text style={styles.statValue}>${totalIncome.toLocaleString()}</Text>
                            </View>
                        </View>
                        <View style={styles.statItem}>
                            <View style={styles.statIconBgExpense}>
                                <TrendingDown size={14} color="#fda4af" />
                            </View>
                            <View>
                                <Text style={styles.statLabel}>Expense</Text>
                                <Text style={styles.statValue}>${totalExpense.toLocaleString()}</Text>
                            </View>
                        </View>
                    </View>
                </View>
                <View style={styles.balanceCardDecoration} />
            </View>

            {/* Auto Create Button (Replaces AI Advisor) */}
            <View style={styles.voiceCard}>
                <View style={styles.voiceHeader}>
                    <Text style={styles.voiceTitle}>Auto Create</Text>
                    <Text style={styles.voiceSubtitle}>Speak to record transactions</Text>
                </View>

                <TouchableOpacity
                    style={[
                        styles.micButton,
                        recording ? styles.micButtonActive : null,
                        isProcessing ? styles.micButtonDisabled : null
                    ]}
                    onPress={recording ? stopRecording : startRecording}
                    disabled={isProcessing}
                >
                    {isProcessing ? (
                        <ActivityIndicator color="#ffffff" />
                    ) : recording ? (
                        <StopCircle size={32} color="#ffffff" />
                    ) : (
                        <Mic size={32} color="#ffffff" />
                    )}
                </TouchableOpacity>

                <Text style={styles.micHint}>
                    {isProcessing ? "Processing your voice..." : recording ? "Listening... Tap to stop" : "Tap to start speaking"}
                </Text>
            </View>

            {/* Recent Transactions */}
            <View>
                <Text style={styles.sectionTitle}>Cycle Transactions</Text>
                <View style={styles.card}>
                    {currentCycleTransactions.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>No transactions in this cycle yet.</Text>
                        </View>
                    ) : (
                        currentCycleTransactions
                            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                            .slice(0, 5)
                            .map((t, idx, arr) => {
                                const cat = categories.find(c => c.id === t.category_id);
                                return (
                                    <View
                                        key={t.id}
                                        style={[
                                            styles.transactionItem,
                                            idx === arr.length - 1 && { borderBottomWidth: 0 }
                                        ]}
                                    >
                                        <View style={styles.txLeft}>
                                            <View style={[
                                                styles.categoryIconBg,
                                                { backgroundColor: cat?.type === TransactionType.INCOME ? '#ecfdf5' : '#fff1f2' }
                                            ]}>
                                                <IconByName
                                                    name={cat?.icon || 'Tag'}
                                                    size={20}
                                                    color={cat?.type === TransactionType.INCOME ? '#059669' : '#e11d48'}
                                                />
                                            </View>
                                            <View>
                                                <Text style={styles.txName}>{cat?.name || 'Unknown'}</Text>
                                                <Text style={styles.txDate}>{format(new Date(t.date), 'MMM dd, yyyy')}</Text>
                                            </View>
                                        </View>
                                        <View>
                                            <Text style={[
                                                styles.txAmount,
                                                { color: cat?.type === TransactionType.INCOME ? '#059669' : '#1e293b' }
                                            ]}>
                                                {cat?.type === TransactionType.INCOME ? '+' : '-'}${t.amount.toLocaleString()}
                                            </Text>
                                        </View>
                                    </View>
                                );
                            })
                    )}
                </View>
            </View>

            {/* Settings Modal */}
            <Modal
                transparent
                visible={isSettingsOpen}
                animationType="fade"
                onRequestClose={() => setIsSettingsOpen(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Cycle Settings</Text>
                        <Text style={styles.modalSubtitle}>Select the day of the month when your billing cycle resets.</Text>

                        <View style={styles.pickerContainer}>
                            <Picker
                                selectedValue={tempStartDay}
                                onValueChange={(itemValue) => setTempStartDay(itemValue)}
                            >
                                {[...Array(31)].map((_, i) => (
                                    <Picker.Item key={i + 1} label={`Day ${i + 1}`} value={i + 1} />
                                ))}
                            </Picker>
                        </View>

                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                onPress={() => setIsSettingsOpen(false)}
                                style={[styles.modalButton, styles.cancelButton]}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={saveSettings}
                                style={[styles.modalButton, styles.saveButton]}
                            >
                                <Text style={styles.saveButtonText}>Save</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    content: {
        padding: 20,
        gap: 24,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    greeting: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1e293b',
    },
    cycleBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 4,
    },
    cycleText: {
        fontSize: 12,
        color: '#64748b',
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    iconButton: {
        padding: 8,
        borderRadius: 99,
        backgroundColor: 'rgba(0,0,0,0.03)',
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: '#ffffff',
    },
    balanceCard: {
        backgroundColor: '#4f46e5',
        borderRadius: 24,
        padding: 24,
        overflow: 'hidden',
        position: 'relative',
    },
    balanceInfo: {
        zIndex: 1,
    },
    balanceLabel: {
        color: '#e0e7ff',
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 4,
    },
    balanceAmount: {
        color: '#ffffff',
        fontSize: 36,
        fontWeight: '700',
        marginBottom: 20,
    },
    statsGrid: {
        flexDirection: 'row',
        gap: 16,
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
    },
    statIconBgIncome: {
        backgroundColor: 'rgba(16,185,129,0.3)',
        padding: 4,
        borderRadius: 99,
    },
    statIconBgExpense: {
        backgroundColor: 'rgba(244,63,94,0.3)',
        padding: 4,
        borderRadius: 99,
    },
    statLabel: {
        fontSize: 10,
        color: '#e0e7ff',
    },
    statValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#ffffff',
    },
    balanceCardDecoration: {
        position: 'absolute',
        right: -40,
        top: -40,
        width: 128,
        height: 128,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 64,
    },
    voiceCard: {
        backgroundColor: '#ffffff',
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#f1f5f9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    voiceHeader: {
        alignItems: 'center',
        marginBottom: 20,
    },
    voiceTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1e293b',
    },
    voiceSubtitle: {
        fontSize: 13,
        color: '#64748b',
        marginTop: 4,
    },
    micButton: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#4f46e5',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#4f46e5',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    micButtonActive: {
        backgroundColor: '#ef4444',
        shadowColor: '#ef4444',
        transform: [{ scale: 1.1 }],
    },
    micButtonDisabled: {
        backgroundColor: '#94a3b8',
        shadowColor: '#94a3b8',
    },
    micHint: {
        marginTop: 16,
        fontSize: 12,
        color: '#94a3b8',
        fontWeight: '500',
    },
    card: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#334155',
        marginBottom: 12,
    },
    emptyContainer: {
        padding: 32,
        alignItems: 'center',
    },
    emptyText: {
        color: '#94a3b8',
        fontSize: 14,
    },
    transactionItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f8fafc',
    },
    txLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    categoryIconBg: {
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
    txDate: {
        fontSize: 12,
        color: '#94a3b8',
    },
    txAmount: {
        fontSize: 16,
        fontWeight: '700',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#ffffff',
        borderRadius: 24,
        padding: 24,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1e293b',
        marginBottom: 8,
    },
    modalSubtitle: {
        fontSize: 14,
        color: '#64748b',
        marginBottom: 20,
    },
    pickerContainer: {
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        marginBottom: 24,
        overflow: 'hidden',
    },
    modalActions: {
        flexDirection: 'row',
        gap: 12,
    },
    modalButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#f8fafc',
    },
    cancelButtonText: {
        color: '#64748b',
        fontWeight: '600',
    },
    saveButton: {
        backgroundColor: '#4f46e5',
    },
    saveButtonText: {
        color: '#ffffff',
        fontWeight: '600',
    },
});

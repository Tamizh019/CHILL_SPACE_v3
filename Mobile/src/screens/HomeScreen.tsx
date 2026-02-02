import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, StatusBar } from 'react-native';
import { useGlobalStore } from '@/context/GlobalStoreContext';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '@/lib/supabase';
import { LinearGradient } from 'expo-linear-gradient';

export default function HomeScreen() {
    const { channels, friends, user } = useGlobalStore();
    const navigation = useNavigation<any>();
    const [activeTab, setActiveTab] = useState<'channels' | 'dms'>('channels');

    const handleSignOut = async () => {
        await supabase.auth.signOut();
    };

    const renderChannel = ({ item }: { item: any }) => (
        <TouchableOpacity
            className="flex-row items-center p-4 mx-4 mb-3 bg-slate-800/50 rounded-2xl border border-slate-700/50"
            onPress={() => navigation.navigate('Chat', { channelId: item.id, name: item.name })}
        >
            <View className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-900/20 items-center justify-center mr-4 border border-emerald-500/30">
                <Text className="text-emerald-400 font-bold text-xl">#</Text>
            </View>
            <View className="flex-1">
                <Text className="text-white font-bold text-lg mb-1">{item.name}</Text>
                <Text className="text-slate-400 text-sm" numberOfLines={1}>
                    {item.description || "Welcome to the chill zone"}
                </Text>
            </View>
            <View className="w-2 h-2 rounded-full bg-slate-600" />
        </TouchableOpacity>
    );

    const renderFriend = ({ item }: { item: any }) => (
        <TouchableOpacity
            className="flex-row items-center p-4 mx-4 mb-3 bg-slate-800/50 rounded-2xl border border-slate-700/50"
            onPress={() => navigation.navigate('Chat', { userId: item.id, name: item.username, type: 'dm' })}
        >
            <View className="w-12 h-12 rounded-full bg-slate-700 mr-4 overflow-hidden border-2 border-slate-600">
                {item.avatar_url ? (
                    <View className="w-full h-full bg-slate-600" />
                ) : (
                    <View className="w-full h-full bg-slate-700 items-center justify-center">
                        <Text className="text-white font-bold text-lg">{item.username?.[0]?.toUpperCase()}</Text>
                    </View>
                )}
            </View>
            <View className="flex-1">
                <Text className="text-white font-bold text-lg mb-1">{item.username}</Text>
                <View className="flex-row items-center">
                    <View className="w-2 h-2 rounded-full bg-emerald-500 mr-2 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                    <Text className="text-emerald-400 text-xs font-medium">Online</Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <View className="flex-1 bg-slate-950">
            <StatusBar barStyle="light-content" backgroundColor="#020617" />

            {/* Header */}
            <View className="pt-14 pb-6 px-6 bg-slate-950 border-b border-slate-800/50">
                <View className="flex-row justify-between items-center mb-6">
                    <View>
                        <Text className="text-slate-400 text-sm font-medium mb-1">Welcome back,</Text>
                        <Text className="text-white text-2xl font-bold">
                            {user?.username || 'Chiller'} 👋
                        </Text>
                    </View>
                    <TouchableOpacity
                        onPress={handleSignOut}
                        className="bg-slate-800 p-2 rounded-full border border-slate-700"
                    >
                        <Text className="text-xs text-red-400 font-bold px-2">Log Out</Text>
                    </TouchableOpacity>
                </View>

                {/* Custom Tab Switcher */}
                <View className="flex-row p-1 bg-slate-900 rounded-xl border border-slate-800">
                    <TouchableOpacity
                        className={`flex-1 py-3 rounded-lg items-center ${activeTab === 'channels' ? 'bg-slate-800 shadow-sm' : ''}`}
                        onPress={() => setActiveTab('channels')}
                    >
                        <Text className={`font-bold ${activeTab === 'channels' ? 'text-white' : 'text-slate-500'}`}>
                            Channels
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        className={`flex-1 py-3 rounded-lg items-center ${activeTab === 'dms' ? 'bg-slate-800 shadow-sm' : ''}`}
                        onPress={() => setActiveTab('dms')}
                    >
                        <Text className={`font-bold ${activeTab === 'dms' ? 'text-white' : 'text-slate-500'}`}>
                            Messages
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Content List */}
            <FlatList
                data={activeTab === 'channels' ? channels : friends}
                keyExtractor={(item) => item.id}
                renderItem={activeTab === 'channels' ? renderChannel : renderFriend}
                className="flex-1 pt-4"
                contentContainerStyle={{ paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={() => (
                    <View className="items-center justify-center mt-20 opacity-50">
                        <Text className="text-slate-500 text-lg">No {activeTab} found</Text>
                    </View>
                )}
            />
        </View>
    );
}

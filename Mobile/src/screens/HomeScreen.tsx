import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image } from 'react-native';
import { useGlobalStore } from '@/context/GlobalStoreContext';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '@/lib/supabase';

export default function HomeScreen() {
    const { channels, friends, user } = useGlobalStore();
    const navigation = useNavigation<any>();
    const [activeTab, setActiveTab] = useState<'channels' | 'dms'>('channels');

    const handleSignOut = async () => {
        await supabase.auth.signOut();
    };

    const renderChannel = ({ item }: { item: any }) => (
        <TouchableOpacity
            className="flex-row items-center p-4 border-b border-slate-800 bg-slate-900 active:bg-slate-800"
            onPress={() => navigation.navigate('Chat', { channelId: item.id, name: item.name })}
        >
            <View className="w-10 h-10 rounded-full bg-slate-700 items-center justify-center mr-3">
                <Text className="text-white font-bold text-lg">#</Text>
            </View>
            <View>
                <Text className="text-white font-semibold text-base">{item.name}</Text>
                <Text className="text-slate-500 text-xs" numberOfLines={1}>{item.description}</Text>
            </View>
        </TouchableOpacity>
    );

    const renderFriend = ({ item }: { item: any }) => (
        <TouchableOpacity
            className="flex-row items-center p-4 border-b border-slate-800 bg-slate-900 active:bg-slate-800"
            onPress={() => navigation.navigate('Chat', { userId: item.id, name: item.username, type: 'dm' })}
        >
            <View className="w-10 h-10 rounded-full bg-slate-700 mr-3 overflow-hidden">
                {item.avatar_url ? (
                    // Note: We might need a proper Image component with uri, simple View for now
                    <View className="w-full h-full bg-emerald-500" />
                ) : (
                    <View className="w-full h-full bg-slate-600 items-center justify-center">
                        <Text className="text-white font-bold">{item.username?.[0]?.toUpperCase()}</Text>
                    </View>
                )}
            </View>
            <View>
                <Text className="text-white font-semibold text-base">{item.username}</Text>
                <Text className="text-slate-500 text-xs text-emerald-400">Online</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <View className="flex-1 bg-slate-950">
            {/* Header */}
            <View className="flex-row justify-between items-center p-4 bg-slate-900 border-b border-slate-800 pt-12">
                <Text className="text-white text-xl font-bold">Chill Space</Text>
                <TouchableOpacity onPress={handleSignOut} className="bg-red-500/10 px-3 py-1 rounded-full">
                    <Text className="text-red-400 text-xs font-bold">Logout</Text>
                </TouchableOpacity>
            </View>

            {/* Tabs */}
            <View className="flex-row p-2 bg-slate-900">
                <TouchableOpacity
                    className={`flex-1 p-2 rounded-lg items-center ${activeTab === 'channels' ? 'bg-slate-800' : ''}`}
                    onPress={() => setActiveTab('channels')}
                >
                    <Text className={`font-bold ${activeTab === 'channels' ? 'text-white' : 'text-slate-500'}`}>Channels</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    className={`flex-1 p-2 rounded-lg items-center ${activeTab === 'dms' ? 'bg-slate-800' : ''}`}
                    onPress={() => setActiveTab('dms')}
                >
                    <Text className={`font-bold ${activeTab === 'dms' ? 'text-white' : 'text-slate-500'}`}>Direct Messages</Text>
                </TouchableOpacity>
            </View>

            {/* List */}
            <FlatList
                data={activeTab === 'channels' ? channels : friends}
                keyExtractor={(item) => item.id}
                renderItem={activeTab === 'channels' ? renderChannel : renderFriend}
                className="flex-1"
                contentContainerStyle={{ paddingBottom: 20 }}
            />
        </View>
    );
}

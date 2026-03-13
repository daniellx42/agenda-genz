import { SkeletonBox } from "@/components/ui/skeleton-box";
import { View } from "react-native";

export function ServiceCardSkeleton() {
  return (
    <View className="mb-2 rounded-2xl border border-rose-100 bg-white p-4">
      <View className="flex-row items-center gap-3">
        <SkeletonBox style={{ width: 48, height: 48, borderRadius: 18 }} />
        <View className="flex-1">
          <SkeletonBox style={{ height: 16, width: 128 }} />
          <SkeletonBox style={{ marginTop: 8, height: 12, width: 160 }} />
          <SkeletonBox style={{ marginTop: 8, height: 12, width: 112 }} />
        </View>
        <SkeletonBox style={{ width: 64, height: 32, borderRadius: 16 }} />
      </View>
      <View className="mt-4 flex-row gap-2">
        <SkeletonBox style={{ height: 44, flex: 1, borderRadius: 16 }} />
        <SkeletonBox style={{ height: 44, flex: 1, borderRadius: 16 }} />
      </View>
    </View>
  );
}

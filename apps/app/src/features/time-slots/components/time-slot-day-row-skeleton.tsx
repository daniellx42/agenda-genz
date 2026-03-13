import { SkeletonBox } from "@/components/ui/skeleton-box";
import { View } from "react-native";

export function TimeSlotDayRowSkeleton() {
  return (
    <View className="mb-4 rounded-2xl border border-rose-100 bg-white p-4">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <SkeletonBox style={{ width: 32, height: 32, borderRadius: 16 }} />
          <SkeletonBox style={{ width: 96, height: 16 }} />
        </View>
        <SkeletonBox style={{ width: 32, height: 32, borderRadius: 16 }} />
      </View>

      <View className="my-3 h-px bg-zinc-100" />

      <View className="mb-3 flex-row flex-wrap gap-2">
        <SkeletonBox style={{ width: 72, height: 22, borderRadius: 11 }} />
        <SkeletonBox style={{ width: 86, height: 22, borderRadius: 11 }} />
        <SkeletonBox style={{ width: 82, height: 22, borderRadius: 11 }} />
      </View>

      <View className="flex-row flex-wrap gap-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <SkeletonBox
            key={index}
            style={{ width: 84, height: 36, borderRadius: 14 }}
          />
        ))}
      </View>
    </View>
  );
}

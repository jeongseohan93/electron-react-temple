interface RewardItem {
    Name: string;
    Icon: string;
    Grade: string;
    StartTimes: string[] | null;
}

interface LevelRewardItems {
    ItemLevel: number;
    Items: RewardItem[];
}

interface ContentsCalendar {
    CategoryName: string;
    ContentsName: string;
    ContentsIcon: string;
    MinItemLevel: number;
    StartTimes: string[];
    Location: string;
    RewardItems: LevelRewardItems[];
}

interface SidebarProps {
    isCollapsed: boolean;
    onToggleCollapse: () => void;
}
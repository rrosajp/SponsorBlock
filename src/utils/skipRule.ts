import { getCurrentPageTitle } from "../../maze-utils/src/elements";
import { getChannelIDInfo, getVideoDuration } from "../../maze-utils/src/video";
import Config from "../config";
import { CategorySelection, CategorySkipOption, SponsorSourceType, SponsorTime } from "../types";
import { VideoLabelsCacheData } from "./videoLabels";

export interface Permission {
    canSubmit: boolean;
}

export enum SkipRuleAttribute {
    StartTime = "time.start",
    EndTime = "time.end",
    Duration = "time.duration",
    StartTimePercent = "time.startPercent",
    EndTimePercent = "time.endPercent",
    DurationPercent = "time.durationPercent",
    Category = "category",
    ActionType = "actionType",
    Description = "chapter.name",
    Source = "chapter.source",
    ChannelID = "channel.id",
    ChannelName = "channel.name",
    VideoDuration = "video.duration",
    Title = "video.title"
}

export enum SkipRuleOperator {
    Less = "<",
    LessOrEqual = "<=",
    Greater = ">",
    GreaterOrEqual = ">=",
    Equal = "==",
    NotEqual = "!=",
    Contains = "*=",
    NotContains = "!*=",
    Regex = "~=",
    RegexIgnoreCase = "~i=",
    NotRegex = "!~=",
    NotRegexIgnoreCase = "!~i="
}

export interface AdvancedSkipRule {
    attribute: SkipRuleAttribute;
    operator: SkipRuleOperator;
    value: string | number;
}

export interface AdvancedSkipRuleSet {
    rules: AdvancedSkipRule[];
    skipOption: CategorySkipOption;
    comment: string;
}

export function getCategorySelection(segment: SponsorTime | VideoLabelsCacheData): CategorySelection {
    for (const ruleSet of Config.local.skipRules) {
        if (ruleSet.rules.every((rule) => isSkipRulePassing(segment, rule))) {
            return { name: segment.category, option: ruleSet.skipOption } as CategorySelection;
        }
    }

    for (const selection of Config.config.categorySelections) {
        if (selection.name === segment.category) {
            return selection;
        }
    }
    return { name: segment.category, option: CategorySkipOption.Disabled} as CategorySelection;
}

function getSkipRuleValue(segment: SponsorTime | VideoLabelsCacheData, rule: AdvancedSkipRule): string | number | undefined {
    switch (rule.attribute) {
        case SkipRuleAttribute.StartTime:
            return (segment as SponsorTime).segment?.[0];
        case SkipRuleAttribute.EndTime:
            return (segment as SponsorTime).segment?.[1];
        case SkipRuleAttribute.Duration:
            return (segment as SponsorTime).segment?.[1] - (segment as SponsorTime).segment?.[0];
        case SkipRuleAttribute.StartTimePercent: {
            const startTime = (segment as SponsorTime).segment?.[0];
            if (startTime === undefined) return undefined;

            return startTime / getVideoDuration() * 100;
        }
        case SkipRuleAttribute.EndTimePercent: {
            const endTime = (segment as SponsorTime).segment?.[1];
            if (endTime === undefined) return undefined;

            return endTime / getVideoDuration() * 100;
        }
        case SkipRuleAttribute.DurationPercent: {
            const startTime = (segment as SponsorTime).segment?.[0];
            const endTime = (segment as SponsorTime).segment?.[1];
            if (startTime === undefined || endTime === undefined) return undefined;

            return (endTime - startTime) / getVideoDuration() * 100;
        }
        case SkipRuleAttribute.Category:
            return segment.category;
        case SkipRuleAttribute.ActionType:
            return (segment as SponsorTime).actionType;
        case SkipRuleAttribute.Description:
            return (segment as SponsorTime).description || "";
        case SkipRuleAttribute.Source:
            switch ((segment as SponsorTime).source) {
                case SponsorSourceType.Local:
                    return "local";
                case SponsorSourceType.YouTube:
                    return "youtube";
                case SponsorSourceType.Autogenerated:
                    return "autogenerated";
                case SponsorSourceType.Server:
                    return "server";
                default:
                    return undefined;
            }
        case SkipRuleAttribute.ChannelID:
            getChannelIDInfo()
            return getChannelIDInfo().id;
        case SkipRuleAttribute.ChannelName:
            getChannelIDInfo()
            return getChannelIDInfo().author;
        case SkipRuleAttribute.VideoDuration:
            return getVideoDuration();
        case SkipRuleAttribute.Title:
            return getCurrentPageTitle() || "";
        default:
            return undefined;
    }
}

function isSkipRulePassing(segment: SponsorTime | VideoLabelsCacheData, rule: AdvancedSkipRule): boolean {
    const value = getSkipRuleValue(segment, rule);
    
    switch (rule.operator) {
        case SkipRuleOperator.Less:
            return typeof value === "number" && value < (rule.value as number);
        case SkipRuleOperator.LessOrEqual:
            return typeof value === "number" && value <= (rule.value as number);
        case SkipRuleOperator.Greater:
            return typeof value === "number" && value > (rule.value as number);
        case SkipRuleOperator.GreaterOrEqual:
            return typeof value === "number" && value >= (rule.value as number);
        case SkipRuleOperator.Equal:
            return value === rule.value;
        case SkipRuleOperator.NotEqual:
            return value !== rule.value;
        case SkipRuleOperator.Contains:
            return String(value).toLocaleLowerCase().includes(String(rule.value).toLocaleLowerCase());
        case SkipRuleOperator.NotContains:
            return !String(value).toLocaleLowerCase().includes(String(rule.value).toLocaleLowerCase());
        case SkipRuleOperator.Regex:
            return new RegExp(rule.value as string).test(String(value));
        case SkipRuleOperator.RegexIgnoreCase:
            return new RegExp(rule.value as string, "i").test(String(value));
        case SkipRuleOperator.NotRegex:
            return !new RegExp(rule.value as string).test(String(value));
        case SkipRuleOperator.NotRegexIgnoreCase:
            return !new RegExp(rule.value as string, "i").test(String(value));
        default:
            return false;
    }
}

export function getCategoryDefaultSelection(category: string): CategorySelection {
    for (const selection of Config.config.categorySelections) {
        if (selection.name === category) {
            return selection;
        }
    }
    return { name: category, option: CategorySkipOption.Disabled} as CategorySelection;
}
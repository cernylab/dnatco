import React from "react";
import * as Select from '@radix-ui/react-select';
import {
    TriangleDownIcon,
    TriangleUpIcon,
    CheckIcon,
} from "@radix-ui/react-icons";

interface RadixComboBoxProps{
    options: { caption: string; value: string }[];
    placeholder?: string;
    value: string;
    onChange: (val: string) => void;
    theme?: "light" | "dark";
    disabled?: boolean;
}

export const RadixComboBox = ({
  options = [],
  placeholder = "Choose...",
  value,
  onChange,
  theme = "dark",
  disabled = false
}: RadixComboBoxProps) => {

    const isLight = theme === "light";
    const bgColor = isLight ? "bg-secondary-second" : "bg-primary-first";
    const textColor = isLight ? "text-primary-first" : "text-white";

    const triggerTextColor = disabled ? "text-secondary-third" : textColor;

    return(
        <Select.Root value={value} onValueChange={onChange}>
            <Select.Trigger
                className={`flex w-full items-center justify-between rounded-standard p-4 outline-none transition-opacity disabled:cursor-not-allowed disabled:opacity-80 ${bgColor} ${triggerTextColor}`}>
                <Select.Value placeholder={placeholder} />
                <Select.Icon>
                    <TriangleDownIcon />
                </Select.Icon>
            </Select.Trigger>

            <Select.Portal>
                <Select.Content
                    className={`overflow-hidden bg-[#2b2a33] flex w-full items-center justify-center rounded-standard p-1 outline-none text-white cursor-pointer`}
                    position="popper"
                    align="center"
                    sideOffset={4}
                >
                    <Select.ScrollUpButton>
                        <TriangleUpIcon />
                    </Select.ScrollUpButton>
                    <Select.Viewport>
                        {
                            options.map((item) =>
                                <Select.Item
                                    key={item.caption}
                                    value={item.value}
                                    className="relative outline-none justify-between flex p-1 data-[highlighted]:bg-[#52525e] data-[highlighted]:text-white cursor-pointer"
                                >
                                    <Select.ItemText>{item.caption}</Select.ItemText>
                                    <Select.ItemIndicator
                                        className="data-[highlighted]:bg-[#52525e]">
                                        <CheckIcon />
                                    </Select.ItemIndicator>
                                </Select.Item>
                            )
                        }

                    </Select.Viewport>
                    <Select.ScrollDownButton>
                        <TriangleDownIcon />
                    </Select.ScrollDownButton>
                </Select.Content>
            </Select.Portal>
        </Select.Root>
    )

}
import React, {useRef, useState} from "react";
import * as Select from '@radix-ui/react-select';
import {
  TriangleDownIcon,
  TriangleUpIcon,
  CheckIcon,
} from "@radix-ui/react-icons";

interface RadixComboBoxProps {
  options: { caption: string; value: string }[];
  placeholder?: string;
  value: string;
  onChange: (val: string) => void;
  theme?: "light" | "dark";
  disabled?: boolean;
  triggerStyle?: string;
  contentStyle?: string;
  itemStyle?: string;
  triggerAddStyle?: string;
  contentAddStyle?: string;
  itemAddStyle?: string;
  triggerValueStyle?: string;
}

export const RadixComboBox = ({
                                options = [],
                                placeholder = "Choose...",
                                value,
                                onChange,
                                theme = "dark",
                                disabled = false,
                                triggerStyle = "",
                                contentStyle = "",
                                itemStyle = "",
                                triggerAddStyle = "",
                                contentAddStyle = "",
                                itemAddStyle = "",
                                triggerValueStyle = "",
                              }: RadixComboBoxProps) => {

  const isLight = theme === "light";
  const bgColor = isLight ? "bg-secondary-second" : "bg-primary-first";
  const textColor = isLight ? "text-primary-first" : "text-white";
  const triggerTextColor = disabled ? "text-secondary-third" : textColor;

  const defTriggerStyle = `inline-flex items-center justify-between rounded-standard h-auto gap-1 m-auto mx-1 p-1 outline-none transition-opacity disabled:cursor-not-allowed disabled:opacity-80 ` + triggerAddStyle;
  const defContentStyle = `overflow-hidden max-h-[var(--radix-select-content-available-height)] bg-[#2b2a33] w-full rounded-standard p-1 outline-none text-white cursor-pointer ` + contentAddStyle;
  const defItemStyle = "relative outline-none justify-between text-16px font-700 flex p-1 data-[highlighted]:bg-[#52525e] data-[highlighted]:text-white cursor-pointer " + itemAddStyle;

  let finalTriggerStyle = triggerStyle || defTriggerStyle;
  finalTriggerStyle = finalTriggerStyle + ` ${bgColor}` + ` ${triggerTextColor} ` + ` cursor-pointer `;
  const finalContentStyle = contentStyle || defContentStyle;
  const finalItemStyle = itemStyle || defItemStyle;

  const [_open, _setOpen] = useState(false);
  const openLastChangeTime = useRef<number>(0);

  const safeSetOpen = (openChange:boolean) => {
    if ((Date.now() - openLastChangeTime.current) > 300) {
      _setOpen(openChange);
      openLastChangeTime.current = Date.now();
    }
  }
  return (
    <Select.Root value={value} onValueChange={onChange} open={_open}
                 onOpenChange={(isOpen) => {
                   if(isOpen){
                     safeSetOpen(true);
                   }else {
                     safeSetOpen(false);
                 }}}>
      <Select.Trigger
        className={finalTriggerStyle}
      >
              <span className={triggerValueStyle}>
                <Select.Value placeholder={placeholder}/>
              </span>
        <Select.Icon>
          <TriangleDownIcon/>
        </Select.Icon>
      </Select.Trigger>

      <Select.Portal>
        <Select.Content
          className={finalContentStyle}
          position="popper"
          align="center"
          sideOffset={4}
        >
          <Select.ScrollUpButton>
            <TriangleUpIcon/>
          </Select.ScrollUpButton>
          <Select.Viewport>
            {
              options.map((item) =>
                <Select.Item
                  key={item.caption}
                  value={item.value}
                  className={finalItemStyle}
                >
                  <Select.ItemText>{item.caption}</Select.ItemText>
                  <Select.ItemIndicator
                    className="data-[highlighted]:bg-[#52525e]">
                    <CheckIcon/>
                  </Select.ItemIndicator>
                </Select.Item>
              )
            }

          </Select.Viewport>
          <Select.ScrollDownButton>
            <TriangleDownIcon/>
          </Select.ScrollDownButton>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  )

}
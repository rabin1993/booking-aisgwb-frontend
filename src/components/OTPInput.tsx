"use client";
import { useEffect, useRef } from "react";
import { FormControl, FormLabel } from "react-bootstrap";

type OTPInputProps = {
  code: string[];
  setCode: (value: string[]) => void;
  label?: string;
  labelClassName?: string;
  inputClassName?: string;
};

const OTPInput = ({
  code,
  setCode,
  inputClassName,
  label,
  labelClassName,
}: OTPInputProps) => {
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (code.every((c) => !c)) {
      inputsRef.current[0]?.focus();
    }
  }, [code]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    idx: number,
  ) => {
    const value = e.target.value;
    if (!/^\d?$/.test(value)) return;

    const newCode = [...code];
    newCode[idx] = value;
    setCode(newCode);

    if (value && idx < inputsRef.current.length - 1) {
      inputsRef.current[idx + 1]?.focus();
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    idx: number,
  ) => {
    if (e.key === "Backspace" && !code[idx] && idx > 0) {
      inputsRef.current[idx - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim();
    if (!/^\d+$/.test(pastedData)) return;
    const digits = pastedData.slice(0, code.length).split("");
    const newCode = [...code];
    digits.forEach((digit, i) => {
      newCode[i] = digit;
    });
    setCode(newCode);
    const nextIndex = Math.min(digits.length, code.length - 1);
    inputsRef.current[nextIndex]?.focus();
  };

  return (
    <>
      <FormLabel className={labelClassName}>
        {label} <span className="text-danger">*</span>
      </FormLabel>
      <div className="d-flex gap-2 two-factor">
        {code.map((number, idx) => (
          <FormControl
            key={idx}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            className={`text-center ${inputClassName}`}
            value={number}
            onChange={(e) =>
              handleChange(e as React.ChangeEvent<HTMLInputElement>, idx)
            }
            onKeyDown={(e) =>
              handleKeyDown(e as React.KeyboardEvent<HTMLInputElement>, idx)
            }
            onPaste={handlePaste}
            ref={(el: HTMLInputElement | null) => {
              inputsRef.current[idx] = el;
            }}
            autoComplete="one-time-code"
          />
        ))}
      </div>
    </>
  );
};

export default OTPInput;

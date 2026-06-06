import React, { useId } from 'react';

export default function SearchableSelect({ value, onChange, children, style, className, disabled, placeholder, required, ...rest }) {
  const id = useId();

  // Extract options from children
  const extractOptions = (children) => {
    let opts = [];
    React.Children.forEach(children, child => {
      if (!child) return;
      if (child.type === 'option') {
        opts.push({
          value: child.props.value !== undefined ? child.props.value : child.props.children,
          label: child.props.children,
          isDisabled: child.props.disabled
        });
      } else if (child.props && child.props.children) {
        opts = opts.concat(extractOptions(child.props.children));
      }
    });
    return opts;
  };

  const options = extractOptions(children);

  return (
    <>
      <input 
        list={id}
        value={value || ''}
        onChange={(e) => onChange(e)}
        placeholder={placeholder || "Type to search..."}
        disabled={disabled}
        required={required}
        className={className}
        style={{ width: '100%', padding: '0.6rem', background: 'var(--bg-color)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '6px', ...style }}
        {...rest}
      />
      <datalist id={id}>
        {options.map((opt, i) => (
          <option key={i} value={opt.value} disabled={opt.isDisabled}>
            {opt.label !== opt.value ? opt.label : null}
          </option>
        ))}
      </datalist>
    </>
  );
}

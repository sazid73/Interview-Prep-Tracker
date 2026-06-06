import React from 'react';
import Select from 'react-select';

export default function SearchableSelect({ value, onChange, children, style, className, disabled, placeholder, ...rest }) {
  // Flatten children to extract options
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
  const selectedOption = options.find(opt => opt.value === value) || null;

  const customStyles = {
    control: (provided, state) => ({
      ...provided,
      ...style,
      backgroundColor: style?.background || style?.backgroundColor || 'var(--bg-color)',
      borderColor: style?.borderColor || 'var(--border-color)',
      color: style?.color || 'var(--text-primary)',
      minHeight: 'auto',
      borderRadius: style?.borderRadius || '4px',
      padding: 0,
      boxShadow: state.isFocused ? '0 0 0 1px #3b82f6' : 'none',
      border: style?.border || '1px solid var(--border-color)',
      '&:hover': {
        border: style?.border || '1px solid #3b82f6'
      }
    }),
    valueContainer: (provided) => ({
      ...provided,
      padding: style?.padding || '0.2rem 0.5rem',
      margin: 0
    }),
    input: (provided) => ({
      ...provided,
      color: 'var(--text-primary)',
      margin: 0,
      padding: 0
    }),
    singleValue: (provided) => ({
      ...provided,
      color: style?.color || 'var(--text-primary)',
    }),
    menu: (provided) => ({
      ...provided,
      backgroundColor: 'var(--bg-surface)',
      zIndex: 9999,
      border: '1px solid var(--border-color)'
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected ? '#3b82f6' : state.isFocused ? 'var(--bg-color)' : 'transparent',
      color: state.isSelected ? '#fff' : 'var(--text-primary)',
      cursor: 'pointer',
      '&:active': {
        backgroundColor: '#2563eb'
      }
    })
  };

  return (
    <div style={{ flex: style?.flex, width: style?.width }}>
      <Select 
        value={selectedOption}
        onChange={(selected) => {
          if (onChange) {
            onChange({ target: { value: selected ? selected.value : '' } });
          }
        }}
        options={options}
        styles={customStyles}
        isDisabled={disabled}
        placeholder={placeholder || "Select..."}
        className={className}
        isClearable={false}
        isSearchable={true}
        menuPortalTarget={document.body}
        {...rest}
      />
    </div>
  );
}

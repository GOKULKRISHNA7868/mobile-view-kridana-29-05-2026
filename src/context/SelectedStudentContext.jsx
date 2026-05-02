import { createContext, useContext, useState } from "react";

const SelectedStudentContext = createContext();

export const SelectedStudentProvider = ({ children }) => {
  const [selectedStudentUid, setSelectedStudentUid] = useState(null);

  return (
    <SelectedStudentContext.Provider
      value={{ selectedStudentUid, setSelectedStudentUid }}
    >
      {children}
    </SelectedStudentContext.Provider>
  );
};

export const useSelectedStudent = () => {
  return useContext(SelectedStudentContext);
};

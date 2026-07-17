import { Edit, Eye, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";

export default function StudentTable({ students, onDelete }) {
  if (!students || students.length === 0) {
    return (
      <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 transition-colors">
        <p className="text-slate-500 dark:text-slate-400">কোনো শিক্ষার্থী পাওয়া যায়নি।</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors">
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300">
            <tr>
              <th className="px-6 py-4 font-semibold">Student ID</th>
              <th className="px-6 py-4 font-semibold">Student Name</th>
              <th className="px-6 py-4 font-semibold">Class & Roll</th>
              <th className="px-6 py-4 font-semibold">Contact Number</th>
              <th className="px-6 py-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {students.map((student) => (
              <tr key={student.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-200">
                  {student.studentId}
                </td>
                
                {/* Image and Name (Clickable to Details) */}
                <td className="px-6 py-4">
                  <Link to={`/students/details/${student.id}`} className="flex items-center group">
                    {student.photoURL ? (
                      <img src={student.photoURL} alt="student" className="w-8 h-8 rounded-full object-cover mr-3 border border-slate-200 dark:border-slate-700" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold mr-3 group-hover:bg-blue-200 transition-colors">
                        {student.firstName?.charAt(0)}
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {student.firstName} {student.lastName}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{student.gender || "N/A"}</p>
                    </div>
                  </Link>
                </td>
                
                <td className="px-6 py-4">
                  <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-md text-xs font-medium border border-slate-200 dark:border-slate-700">
                    {student.class} - Roll: {student.rollNumber}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                  {student.contactNumber || "N/A"}
                </td>
                
                {/* Actions: View (Eye), Edit (Pencil), Delete (Trash) */}
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end space-x-2">
                    <Link to={`/students/details/${student.id}`} className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition" title="View Details">
                      <Eye className="w-4 h-4" />
                    </Link>
                    <Link to={`/students/edit/${student.id}`} className="p-1.5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded transition" title="Edit Student">
                      <Edit className="w-4 h-4" />
                    </Link>
                    <button onClick={() => onDelete(student.id)} className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition" title="Delete Student">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
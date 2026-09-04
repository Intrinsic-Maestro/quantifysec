export default function UnauthorizedPage() {
  return (
    <div className="max-w-md mx-auto mt-20 text-center">
      <h1 className="text-xl font-semibold">Access denied</h1>

      <p className="text-gray-600 mt-2">
        Your account role doesn't have permission to view this dashboard.
      </p>
    </div>
  )
}
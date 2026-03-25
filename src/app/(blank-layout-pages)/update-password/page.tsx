// Component Imports
import UpdatePassword from '@views/updatepassword'

// Server Action Imports
import { getServerMode } from '@core/utils/serverHelpers'

const UpdatePasswordPage = () => {
  // Vars
  const mode = getServerMode()

  return <UpdatePassword mode={mode} />
}

export default UpdatePasswordPage

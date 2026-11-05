// Component Imports
import UpdatePassword from '@views/updatepassword'

// Server Action Imports
import { getServerMode } from '@core/utils/serverHelpers'

const UpdatePasswordPage = async () => {
  // Vars
  const mode = await getServerMode()

  return <UpdatePassword mode={mode} />
}

export default UpdatePasswordPage

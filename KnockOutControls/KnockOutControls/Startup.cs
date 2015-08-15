using Microsoft.Owin;
using Owin;

[assembly: OwinStartupAttribute(typeof(KnockOutControls.Startup))]
namespace KnockOutControls
{
    public partial class Startup
    {
        public void Configuration(IAppBuilder app)
        {
            ConfigureAuth(app);
        }
    }
}

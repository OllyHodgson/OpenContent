﻿using Satrabel.OpenContent.Components.Alpaca;

namespace Satrabel.OpenContent.Components.Dnn
{
    public interface IGlobalSettingsRepositoryAdapter
    {
        int GetMaxVersions();
        void SetMaxVersions(int maxVersions);

        AlpacaLayoutEnum GetEditLayout();
        void SetEditLayout(AlpacaLayoutEnum editLayout);

        bool GetLoadBootstrap();
        void SetLoadBootstrap(bool @checked);

        string GetGoogleApiKey();
        void SetGoogleApiKey(string text);

        bool GetFastHandlebars();
        void SetFastHandlebars(bool @checked);

        bool GetAutoAttach();
        void SetAutoAttach(string value);

        string GetLoggingScope();
        void SetLoggingScope(string value);

        string GetEditorRoleId();
        void SetEditorRoleId(string value);
    }
}
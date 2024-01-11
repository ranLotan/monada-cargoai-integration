// React imports
import { useState } from 'react';
import OKARGO_PLATFORMS from '../server/OKARGO_PLATFORMS.json';

// Generic imports
import _ from 'lodash';

// MUI imports
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Switch from '@mui/material/Switch';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import InputLabel from '@mui/material/InputLabel';
import LoadingButton from '@mui/lab/LoadingButton';
import FormControl from '@mui/material/FormControl';
import CircularProgress from '@mui/material/CircularProgress';

function Settings(props) {
    const { enabled, setEnabled, getConfiguration, setConfiguration, axiosPassthrough } = props;
    const [ platformsSettings, setPlatformsSettings ] = useState({});

    async function checkOkargoPlatforms({ skipInitChecking } = {}) {
        const platforms = getConfiguration('platforms', []);
        const token = getConfiguration('token', '');

        if (!skipInitChecking) {
            setPlatformsSettings(_.fromPairs(platforms.map(c => ([ c.id, { status: 'checking' } ]))));
        }

        const { data } = await axiosPassthrough({
            url: 'https://app.okargo.com/api/CarrierRatesSettings/GetSettings',
            method: 'POST',
            body: {}, 
            options: {
                headers: { Authorization: `Bearer ${token}` }
            }
        });

        setPlatformsSettings(_.fromPairs(platforms.map(c =>{
            const configurations = data.filter(d => `${d.carrierRatesPlatformId}` === `${c.id}`);

            if (configurations.length === 0) {
                return [ c.id, { status: 'error', description: 'Settings are not updated at Okargo.', data: configurations } ];
            }
            if (configurations.length === 1) {
                return [ c.id, { status: 'ok', description: 'Settings seem to be ok.', data: configurations } ];
            }
            return [ c.id, { status: 'error', description: 'Found multiple settings at Okargo', data: configurations } ];
        })));
    }

    return (
        <Paper sx={{ mt: 3 }}>
            <Box sx={{ display: 'flex', p: 1 }}>
                {enabled && <Chip label='Active' color='chip-sent-to-endcustomer' sx={{ mr: 2 }} />}
                {!enabled && <Chip label='Inactive' sx={{ mr: 2 }} />}
                <Typography variant='h6' sx={{ textDecoration: 'none', fontWeight: 700, flex: 1 }}>
                    Okargo
                </Typography>
                <Switch checked={enabled} onChange={() => setEnabled(!enabled)} />
            </Box>
            {enabled && (
                <Box sx={{ borderTop: '1px solid #eee', p: 3, display: 'flex', flexDirection: 'column' }}>
                    <TextField
                        label='Token'
                        variant='outlined'
                        value={getConfiguration('token', '')}
                        onChange={(e) => {
                            setConfiguration('token', e.target.value);
                        }}
                        sx={{ mb: 2 }}
                    />
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant='body1' sx={{ textDecoration: 'none', fontWeight: 700, marginRight: '24px' }}>
                            Online Platforms
                        </Typography>
                        <LoadingButton color='primary' variant='contained' loading={_.some(platformsSettings, v => v.status === 'checking')} onClick={checkOkargoPlatforms} >
                            Validate
                        </LoadingButton>
                    </Box>
                    {getConfiguration('platforms', []).map((platform, platformIndex) => (
                        <Box sx={{ mb: 1, mt: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }} >
                                <FormControl sx={{ flex: 1, mr: 1 }}>
                                    <InputLabel id='platformid-label'>Platform</InputLabel>
                                    <Select
                                        label='Platform'
                                        value={platform.id}
                                        onChange={(e) => { setConfiguration(`platforms[${platformIndex}].id`, e.target.value) }}
                                    >
                                        {_(OKARGO_PLATFORMS).keys().sortBy(k => OKARGO_PLATFORMS[k].name).map(k => (
                                            <MenuItem key={k} value={k}>{OKARGO_PLATFORMS[k].name}</MenuItem>
                                        )).value()}
                                    </Select>
                                </FormControl>
                                <TextField
                                    sx={{ flex: 1, mr: 1 }}
                                    label='Username'
                                    variant='outlined'
                                    value={platform.username || ''}
                                    onChange={(e) => { setConfiguration(`platforms[${platformIndex}].username`, e.target.value) }}
                                />
                                <TextField
                                    sx={{ flex: 1, mr: 1 }}
                                    label='Password'
                                    variant='outlined'
                                    type='password'
                                    value={platform.password || ''}
                                    onChange={(e) => { setConfiguration(`platforms[${platformIndex}].password`, e.target.value) }}
                                />
                                <Button
                                    disabled={_.some(platformsSettings, v => v.status === 'checking')}
                                    onClick={() => {
                                        const platforms = getConfiguration('platforms', []);
                                        platforms.splice(platformIndex, 1);
                                        setConfiguration('platforms', platforms);
                                    }}
                                >
                                    Remove
                                </Button>
                            </Box>
                            {(platformsSettings[platform.id] || {}).status === 'ok' && (
                                <Alert
                                    severity='success'
                                    sx={{ marginButtom: '12px' }}
                                    action={
                                        <Button color='inherit' size='small' onClick={() => fixOkargoPlatform({ id: platform.id, settings: platform })}>
                                            Reconfigure
                                        </Button>
                                    }
                                >
                                    {platformsSettings[platform.id].description}
                                </Alert>
                            )}
                            {(platformsSettings[platform.id] || {}).status === 'error' && (
                                <Alert 
                                    severity='error' 
                                    sx={{ marginButtom: '12px' }}
                                    action={
                                        <Button color='inherit' size='small' onClick={() => fixOkargoPlatform({ id: platform.id, settings: platform })}>
                                            Fix
                                        </Button>
                                    }
                                >
                                    {platformsSettings[platform.id].description}
                                </Alert>
                            )}
                            {(platformsSettings[platform.id] || {}).status === 'checking' && (
                                <Alert 
                                    icon={false}
                                    severity='info' 
                                    sx={{ marginButtom: '12px' }}
                                >
                                    <CircularProgress size={18} />
                                </Alert>
                            )}
                        </Box>
                    ))}
                    <Button
                        sx={{ flex: 0, width: '170px', marginTop: '12px' }}
                        variant='contained'
                        disabled={_.some(platformsSettings, v => v.status === 'checking')}
                        onClick={() => {
                            const platforms = getConfiguration('platforms', []);
                            platforms.push({ id: '', username: '', password: '' });
                            setConfiguration('platforms', platforms);
                        }}>
                        + Add Portal
                    </Button>
                </Box>
            )}
        </Paper>
    )
}

export default Settings;

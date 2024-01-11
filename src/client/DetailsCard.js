import React from 'react';

// MUI imports
import IconButton from '@mui/material/IconButton';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import TableBody from '@mui/material/TableBody';
import TableHead from '@mui/material/TableHead';
import TableContainer from '@mui/material/TableContainer';
import { yellow } from '@mui/material/colors';

// Font Awesome import
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faStar, faGripDots } from '@fortawesome/pro-solid-svg-icons';
import { faGlobe } from '@fortawesome/pro-light-svg-icons';

// Monada imports
import SupplierLogos from '@monada-ai/monada-shipping-companies-logos';

// Generic imports
import _ from 'lodash';
import { useDrag } from 'react-dnd'
import CurrencyList from 'currency-list';

function DetailsCard(props) {
    const { rate, toggleFavorite, isFavorite, emphasize } = props;

    const attributes = _.get(rate, 'attributes.okargoOffer');
    const originPort = _.get(attributes, 'routes[0].originPort', '');
    const destinationPort = _.get(attributes, 'routes[0].destinationPort', '');
    const transitDays = _.get(attributes, 'routes[0].bestTransitTime');
    const dateStart = _.get(attributes, 'chargeSet.dateBegin').replace(/T00:00:00/, '');
    const dateEnd = (_.get(attributes, 'chargeSet.dateEnd') || '').replace(/T00:00:00/, '');
    const expiration = (_.get(attributes, 'chargeSet.quotValidity') || '').replace(/T00:00:00/, '');
    const routes = _.get(attributes, 'routes');

    return (
        <Box>
            <Box style={{ display: 'flex', alignItems: 'center' }}>
                <SupplierLogos size={SupplierLogos.size.LARGE} organization={rate.supplier.organization} />
                <Box sx={{ flex: 1, marginLeft: '12px' }}>
                    <Box sx={{ fontWeight: '800', fontSize: '15px' }}>
                        {originPort.name} ({originPort.code}) -> {destinationPort.name} ({destinationPort.code})
                    </Box>
                    <Box sx={{ fontWeight: '800', fontSize: '13px' }}>
                        Transit Days: {transitDays} days
                    </Box>
                </Box>
                <Box sx={{ flex: 0, fontSize: '15px', marginRight: '12px' }}>
                    <FontAwesomeIcon icon={faGlobe} />
                </Box>
                {toggleFavorite && (
                    <Box sx={{ flex: 0, width: '30px', minWidth: '30px', maxWidth: '30px' }}>
                        <IconButton onClick={(e) => { e.stopPropagation(); e.preventDefault(); toggleFavorite({ rate }) }}>
                            <FontAwesomeIcon style={{ color: isFavorite ? yellow[500] : undefined }} icon={faStar} />
                        </IconButton>
                    </Box>
                )}
            </Box>
            <Box sx={{ marginTop: '12px', display: 'flex', fontSize: '11px', justifyContent: 'space-between' }}>
                <Box>
                    Shipping Window: <b>{dateStart}</b> - <b>{dateEnd}</b>
                </Box>
                <Box>
                    Expiration: <b>{expiration}</b>
                </Box>
                <Box>
                    Size & Type: <b>{rate.product.type}{rate.product.dangerous ? ' (Dangerous)' : ''}</b>
                </Box>
            </Box>
            {rate.offer.sections.map(section => {
                return (
                    <Box key={section.title} sx={{ marginTop: '12px' }}>
                        <Box sx={{ fontWeight: 800, fontSize: '15px'}}>{section.title}</Box>
                        <Box sx={{ display: 'flex', marginTop: '12px', flexWrap: 'wrap' }}>
                            {section.offers[0].fields.map(field => {
                                const value = _.values(field.values)[0];
                                return (
                                    <OkargoSingleFieldDetails key={field.id} rate={rate} field={field} value={value} emphasize={!!(emphasize || []).find(e => e.rateId === rate.id && e.fieldId === field.id)}/>
                                )
                            })}
                        </Box>
                    </Box>
                );
            })}
            <Box sx={{ marginTop: '18px', fontSize: '17px', fontWeight: 800 }}>
                Shipping Schedule
            </Box>
            <TableContainer>
                <Table>
                    <TableHead>
                        <TableCell>Vessel</TableCell>
                        <TableCell>Voyage</TableCell>
                        <TableCell>ETD</TableCell>
                        <TableCell>ETA</TableCell>
                        <TableCell>Service</TableCell>
                        <TableCell>Est.TT.</TableCell>
                    </TableHead>
                    <TableBody>
                        {routes.map(route => (
                            <TableRow key={route.departs[0].departId}>
                                <TableCell>
                                    {(route.departs[0].vessel || {}).name || '-'}
                                </TableCell>
                                <TableCell>
                                    {route.departs[0].uid || '-'}
                                </TableCell>
                                <TableCell>
                                    {_.get(route, 'transShipmentsLegs[0].departs.etd', null) ? 
                                        new Date(route.transShipmentsLegs[0].depart.etd).toString() :
                                        '-'
                                    }
                                </TableCell>
                                <TableCell>
                                    {_.get(route, 'departs[0].eta', null) ? 
                                        new Date(route.departs[0].eta).toString() :
                                        '-'
                                    }
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    )
}

function OkargoSingleFieldDetails(props) {
    const { rate, field, value, emphasize } = props;

    const [, drag] = useDrag(() => ({
        type: 'RateCardSingleRate',
        item: {
            rate,
            field,
        },
        collect: (monitor) => ({
            isDragging: !!monitor.isDragging()
        })
    }))

    if ((field.type !== 'per-unit') && (field.type !== 'per-unit-type') && (field.type !== 'flat') && (field.type !== 'custom')) return null;

    return (
        <Paper ref={drag} sx={{ cursor: 'move', fontWeight: emphasize ? '800' : '400', display: 'flex', flexDirection: 'column', padding: '6px', textAlign: 'center', margin: '0px 12px 12px 0px', width: '140px', minWidth: '140px', marginBottom: '12px' }}>
            <Box sx={{ fontSize: '13px', fontWeight: emphasize ? '800' : '400', flex: 1 }}>
                {field.title}
            </Box>
            <Box sx={{ fontSize: '13px', fontWeight: emphasize ? '800' : '400', marginTop: '3px' }}>
                {CurrencyList.get(value.currency).symbol}{value.value.toLocaleString(undefined, {minimumFractionDigits: 2})}
            </Box>
            <Box sx={{ fontSize: '12px', fontWeight: emphasize ? '800' : '400', marginTop: '3px', marginBottom: '12px'}}>
                {field.type === 'per-unit' || field.type === 'per-unit-type' ? '/ product' : ''}
                {field.type === 'flat' ? '/ shipment' : ''}
                {field.type === 'custom' ? `/ ${field.multiplierText}` : ''}
            </Box>
            <Box sx={{ fontSize: '12px', fontWeight: emphasize ? '800' : '400', marginTop: '3px', marginBottom: '12px' }}>
                <FontAwesomeIcon icon={faGripDots} />
            </Box>
        </Paper>
    )
}

export default DetailsCard;

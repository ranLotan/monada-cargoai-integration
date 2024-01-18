import React from 'react';

// MUI imports
import Box from '@mui/material/Box';
import { grey } from '@mui/material/colors';

// Font Awesome import
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faGripDotsVertical } from '@fortawesome/pro-solid-svg-icons';

// Generic imports
import _ from 'lodash';
import { useDrag } from 'react-dnd'
import CurrencyList from 'currency-list';

function DetailsCard(props) {
    const { rate, toggleFavorite, isFavorite, emphasize, routeIndex = 0, departIndex = 0 } = props;

    const attributes = _.get(rate, 'attributes.okargoOffer');
    const originPort = _.get(attributes, `routes[${routeIndex}].originPort`, '');
    const destinationPort = _.get(attributes, `routes[${routeIndex}].destinationPort`, '');
    const transitDays = _.get(attributes, `routes[${routeIndex}].bestTransitTime`);
    const dateStart = _.get(attributes, 'chargeSet.dateBegin').replace(/T00:00:00/, '');
    const dateEnd = (_.get(attributes, 'chargeSet.dateEnd') || '').replace(/T00:00:00/, '');
    const expiration = (_.get(attributes, 'chargeSet.quotValidity') || '').replace(/T00:00:00/, '');
    const routes = _.get(attributes, 'routes');
    const vesselName = _.get(attributes, `routes[${routeIndex}].departs[${departIndex}].vessel.name`, null);
    const vesselUid = _.get(attributes, `routes[${routeIndex}].departs[${departIndex}].uid`, 'unknown'); 
    const vesselImo = _.get(attributes, `routes[${routeIndex}].departs[${departIndex}].vessel.imo`, null);
    const vesselService = _.get(attributes, `routes[${routeIndex}].serviceCode`, null);
    const ratesPriceType = _.get(attributes, 'chargeSet.ratesPriceType', null); 
    const moreInfo = _.get(attributes, 'offerInformations', []); 


    return (
        <Box>
            {rate.offer.sections.map(section => {
                return (
                    <Box key={section.title} sx={{ marginBottom: '20px' }}>
                        <Box sx={{ fontWeight: 400, fontSize: '13px', textTransform: 'uppercase', marginBottom: '32px' }}>
                            {section.title}
                        </Box>
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
            <Box sx={{ width: '100%', paddingBottom: '20px', borderTop: '1px solid #D9D9D9' }} />
            <Box sx={{ fontSize: '13px' }}>
                {new Date(rate.offer.validFrom).getTime() > new Date().getTime() ? `Valid from: ${new Date(rate.offer.validFrom).toLocaleDateString('en-GB')}` : ''}
                {new Date(rate.offer.validFrom).getTime() <= new Date().getTime() ? `Valid until: ${new Date(rate.offer.validUntil).toLocaleDateString('en-GB')}` : ''}
                {' · '}
                Shipping Window: {new Date(dateStart).toLocaleDateString('en-GB')} - {new Date(dateEnd).toLocaleDateString('en-GB')}
                {vesselName && <>{` · Vessel: ${vesselName}-${vesselUid}${vesselImo ? ' ' + vesselImo : ''}${vesselService ? ' ' + vesselService : ''}`}</>}
                {ratesPriceType === 'Contract' && <>{` · Rate type: ${ratesPriceType}`}</>}
                {ratesPriceType && ratesPriceType !== 'Contract' && <>{` · Rate type: ${ratesPriceType}`}</>}
                {moreInfo.map((o, i) => (<>{i === 0 ? ` · More info: ` : ', '}<i>{o.content}</i></>))}
            </Box>
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
        <Box
            sx={{ 
                cursor: 'move', 
                padding: '20px',
                width: '100%', 
                minWidth: '100%', 
                marginBottom: '12px',
                border: '1px solid #E0E0E0'
            }}
        >
            <Box
                ref={drag} 
                sx={{ 
                    cursor: 'move', 
                    fontWeight: emphasize ? '800' : '400', 
                    display: 'flex', 
                    alignItems: 'center',
                    width: '100%', 
                    minWidth: '100%', 
                }}
            >
                <Box sx={{ fontWeight: emphasize ? '800' : '400', fontSize: '18px' }}>
                    <FontAwesomeIcon icon={faGripDotsVertical} />
                </Box>
                <Box sx={{ padding: '0px 22px' }}>
                |
                </Box>
                <Box sx={{ fontSize: '10px', fontWeight: emphasize ? '800' : '400' }}>
                    {rate.product.type}
                </Box>
                <Box sx={{ padding: '0px 22px' }}>
                |
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ fontSize: '12px', fontWeight: emphasize ? '800' : '400', marginBottom: '6px' }}>
                        {CurrencyList.get(value.currency).symbol}{value.value.toLocaleString(undefined, {minimumFractionDigits: 2})}
                        {field.type === 'per-unit' || field.type === 'per-unit-type' ? ' / product' : ''}
                        {field.type === 'flat' ? ' / shipment' : ''}
                        {field.type === 'custom' ? ` / ${field.multiplierText}` : ''}
                    </Box>
                    <Box sx={{ fontSize: '12px', color: grey[600] }}>
                        {field.title}
                    </Box>
                </Box>
            </Box>
        </Box>
    )
}

export default DetailsCard;

/*
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
            */
                            /*
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
            */

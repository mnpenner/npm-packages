import {md5} from './Hash.node';

test(md5.name, () => {
    expect(md5('foo')).toBe('acbd18db4cc2f85cedef654fccc4a4d8');
    expect(md5('foo','base64')).toBe('rL0Y20zC+Fzt72VPzMSk2A==');
    expect(md5('','hex')).toBe('d41d8cd98f00b204e9800998ecf8427e');
});